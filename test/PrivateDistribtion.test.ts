import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants } from "@openzeppelin/test-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from 'ethers'
import chai from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)

describe("PrivateDistribution", () => {
    let unmarshalToken: Contract
    let unmarshalTokenMock: Contract
    let privateDistribution: Contract

    let owner: SignerWithAddress
    let investor1: SignerWithAddress
    let investor2: SignerWithAddress
    let investor3: SignerWithAddress
    let otherAccounts: SignerWithAddress[]

    let newTimestamp: number

    beforeEach(async () => {
        [owner, investor1, investor2, investor3, ...otherAccounts] = await ethers.getSigners();

        const UnmarshalToken = await ethers.getContractFactory('UnmarshalToken');
        const UnmarshalTokenMock = await ethers.getContractFactory('UnmarshalTokenMock');
        const PrivateDistribution = await ethers.getContractFactory('PrivateDistribution');
        unmarshalToken = await UnmarshalToken.deploy();
        unmarshalTokenMock = await UnmarshalTokenMock.connect(investor1).deploy();
        privateDistribution = await PrivateDistribution.deploy(unmarshalToken.address);

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const timestamp = block.timestamp;
        newTimestamp = block.timestamp + 60 * 60 * 24;

    });

    describe('Deploy contracts', async () => {
        it('Contracts not to be underfined, null and NaN', async () => {
            expect(unmarshalToken.address).to.be.not.undefined;
            expect(unmarshalToken.address).to.be.not.null;
            expect(unmarshalToken.address).to.be.not.NaN;
            expect(privateDistribution.address).to.be.not.undefined;
            expect(privateDistribution.address).to.be.not.null;
            expect(privateDistribution.address).to.be.not.NaN;
        });

    });

    describe('setInitialTimestamp', async () => {
        it('Reverted if caller is not owner', async () => {
            await expect(privateDistribution.connect(investor1).setInitialTimestamp(newTimestamp))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('Successfully setInitialTimestamp', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            expect(await privateDistribution.isInitialized()).to.be.true;
            expect(await privateDistribution.getInitialTimestamp()).to.be.equal(newTimestamp);
        });

        it('Reverted if setInitialTimestamp already initialized', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            await expect(privateDistribution.setInitialTimestamp(newTimestamp))
                .to.be.revertedWith("initialized");
        });

    });

    describe('addInvestors', async () => {
        beforeEach(async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
        });

        it('Reverted if caller is not owner', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            await expect(privateDistribution.connect(investor1).addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('Reverted if investors is total allocation arrays are different length', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            await expect(privateDistribution.addInvestors([investor1.address, investor2.address, investor3.address], [totalAllocation, totalAllocation], [0, 0]))
                .to.be.revertedWith("different arrays sizes");
        });

        it('Reverted if one of investors addresses is zero address', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            await expect(privateDistribution.addInvestors([investor1.address, constants.ZERO_ADDRESS], [totalAllocation, totalAllocation], [0, 0]))
                .to.be.revertedWith("Invalid address");
        });

        it('Reverted if total allocation less than zero', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            const zeroTotalAllocation = ethers.BigNumber.from('0');
            await expect(privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, zeroTotalAllocation], [0, 0]))
                .to.be.revertedWith("the investor allocation must be more than 0");
        });

        it('Reverted if the investor was already added', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            await expect(privateDistribution.addInvestors([investor1.address, investor2.address, investor1.address], [totalAllocation, totalAllocation, totalAllocation], [0, 0, 1]))
                .to.be.revertedWith("investor already added");
        });

        it('Successfully addes investors', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            await expect(
                privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]))
                .to.emit(privateDistribution, 'InvestorsAdded')
                .withArgs([investor1.address, investor2.address], [totalAllocation, totalAllocation], owner.address);
        });

    });

    describe('withdrawTokens', async () => {
        it('Reverted if not the investor try to withdraw tokens', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            await expect(privateDistribution.connect(investor3).withdrawTokens())
                .to.be.revertedWith("Only investors allowed");
        });

        it('Reverted if initialTimestamp is not initialized', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            await expect(privateDistribution.connect(investor1).withdrawTokens())
                .to.be.revertedWith("not initialized");

        });

        it('Reverted if not exists available tokens for the investor', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]);
            await expect(privateDistribution.connect(investor1).withdrawTokens())
                .to.be.revertedWith("no tokens available for withdrawl");
        });

        it('Successfully withdraw tokens by the investor', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(0);

            await expect(
                privateDistribution.connect(investor1).withdrawTokens())
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(tokensAvailable);
        });

        it('Successfully withdraw tokens by the investor with PRIVATE allocation type', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address], [totalAllocation], [1]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(0);

            await expect(
                privateDistribution.connect(investor1).withdrawTokens())
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(tokensAvailable);
        });

        it('Successfully withdraw tokens by the investor with SEED allocation type', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address], [totalAllocation], [0]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(0);

            await expect(
                privateDistribution.connect(investor1).withdrawTokens())
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(tokensAvailable);
        });

        it('Successfully withdraw tokens by the investor with STRATEGIC allocation type', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address], [totalAllocation], [2]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(0);

            await expect(privateDistribution.connect(investor1).withdrawTokens())
                .to.be.revertedWith("no tokens available for withdrawl");

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(0);
        });

        it('Withdraw tokens if current timestamp less than initial cliff(120 days)', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address], [totalAllocation], [0]);

            const increaseTime = 60 * 60 * 24 * 100; // 100 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(0);

            await expect(
                privateDistribution.connect(investor1).withdrawTokens())
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(tokensAvailable);
        });

    });

    describe('releaseTokens', async () => {
        it('Reverted if caller is not owner', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            await expect(privateDistribution.connect(investor1).releaseTokens())
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('Reverted if initialTimestamp is not initialized', async () => {
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            await expect(privateDistribution.releaseTokens())
                .to.be.revertedWith("not initialized");

        });

        it('Successfully releaseTokens', async () => {
            await privateDistribution.setInitialTimestamp(newTimestamp);
            const totalAllocation = ethers.BigNumber.from('100');
            await privateDistribution.addInvestors([investor1.address, investor2.address], [totalAllocation, totalAllocation], [0, 0]);

            const increaseTime = 60 * 60 * 24 * 380; // 380 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const tokensAvailable = await privateDistribution.withdrawableTokens(investor1.address);

            await unmarshalToken.approve(privateDistribution.address, tokensAvailable);
            await unmarshalToken.transfer(privateDistribution.address, tokensAvailable);

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(0);
            expect(await unmarshalToken.balanceOf(investor2.address)).to.be.equal(0);

            await privateDistribution.releaseTokens();

            expect(await unmarshalToken.balanceOf(investor1.address)).to.be.equal(tokensAvailable);
            expect(await unmarshalToken.balanceOf(investor2.address)).to.be.equal(tokensAvailable);
        });

    });

    describe('recoverToken', async () => {
        it('Reverted if caller is not owner', async () => {
            const recoverAmount = ethers.BigNumber.from("1000");
            await unmarshalTokenMock.connect(investor1).approve(owner.address, recoverAmount);
            await expect(privateDistribution.connect(investor2).recoverToken(unmarshalTokenMock.address, recoverAmount))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        // Fix
        it('Successfully recoverToken', async () => {
            const recoverAmount = ethers.BigNumber.from("1000");
            await unmarshalTokenMock.connect(investor1).approve(owner.address, recoverAmount);
            await expect(
                privateDistribution.recoverToken(unmarshalTokenMock.address, recoverAmount))
                .to.emit(privateDistribution, 'RecoverToken')
                .withArgs(unmarshalTokenMock.address, recoverAmount);
        });

    });

});