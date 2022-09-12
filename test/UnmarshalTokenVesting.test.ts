import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants } from "@openzeppelin/test-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from 'ethers'
import chai from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)

describe("UnmarshalTokenVesting", () => {
    let unmarshalToken: Contract
    let unmarshalTokenMock: Contract
    let privateDistribution: Contract
    let unmarshalTokenVesting: Contract

    let owner: SignerWithAddress
    let investor1: SignerWithAddress
    let investor2: SignerWithAddress
    let investor3: SignerWithAddress
    let stakingRewards: SignerWithAddress
    let ecosystem: SignerWithAddress
    let marketing: SignerWithAddress
    let reserves: SignerWithAddress
    let team: SignerWithAddress
    let otherAccounts: SignerWithAddress[]

    let newTimestamp: number

    beforeEach(async () => {
        [owner, investor1, investor2, investor3, stakingRewards, ecosystem, marketing, reserves, team, ...otherAccounts] = await ethers.getSigners();

        const UnmarshalToken = await ethers.getContractFactory('UnmarshalToken');
        const UnmarshalTokenMock = await ethers.getContractFactory('UnmarshalTokenMock');
        const PrivateDistribution = await ethers.getContractFactory('PrivateDistribution');
        const UnmarshalTokenVesting = await ethers.getContractFactory("UnmarshalTokenVesting");

        unmarshalToken = await UnmarshalToken.deploy();
        unmarshalTokenMock = await UnmarshalTokenMock.connect(investor1).deploy();
        privateDistribution = await PrivateDistribution.deploy(unmarshalToken.address);
        unmarshalTokenVesting = await UnmarshalTokenVesting.deploy(
            unmarshalToken.address,
            stakingRewards.address,
            ecosystem.address,
            marketing.address,
            reserves.address,
            team.address
        );

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const timestamp = block.timestamp;
        newTimestamp = block.timestamp + 60 * 60 * 24;

    });

    describe('Constructor', async () => {
        it('Contracts not to be underfined, null and NaN', async () => {
            expect(unmarshalTokenVesting.address).to.be.not.undefined;
            expect(unmarshalTokenVesting.address).to.be.not.null;
            expect(unmarshalTokenVesting.address).to.be.not.NaN;
        });

        describe('Deploy contracts', async () => {
            it('Reverted if Marsh token is zero address', async () => {
                const UnmarshalTokenVesting = await ethers.getContractFactory("UnmarshalTokenVesting");
                await expect(UnmarshalTokenVesting.deploy(
                    constants.ZERO_ADDRESS,
                    stakingRewards.address,
                    ecosystem.address,
                    marketing.address,
                    reserves.address,
                    team.address
                ))
                    .to.be.revertedWith("Marsh token address is not valid");
            });

            describe('addDistribution', async () => {
                it('Reverted if one of the beneficiary is zero address', async () => {
                    const UnmarshalTokenVesting = await ethers.getContractFactory("UnmarshalTokenVesting");
                    await expect(UnmarshalTokenVesting.deploy(
                        unmarshalToken.address,
                        constants.ZERO_ADDRESS,
                        ecosystem.address,
                        marketing.address,
                        reserves.address,
                        team.address
                    ))
                        .to.be.revertedWith("Invalid address");
                });
            });

        });
    });

    describe('setInitialTimestamp', async () => {
        it('Reverted if caller is not owner', async () => {
            await expect(unmarshalTokenVesting.connect(investor1).setInitialTimestamp(newTimestamp))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('Successfully setInitialTimestamp', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);
            expect(await unmarshalTokenVesting.getInitialTimestamp()).to.be.equal(newTimestamp);
        });

        it('Reverted if setInitialTimestamp already initialized', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);
            await expect(unmarshalTokenVesting.setInitialTimestamp(newTimestamp))
                .to.be.revertedWith("initialized");
        });

    });

    describe('withdrawTokens', async () => {
        it('Reverted if not the owner try to withdraw', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 750; // 750 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            // 0 - STAKING distribution type
            await expect(unmarshalTokenVesting.connect(investor1).withdrawTokens(0))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('Reverted if initialTimestamp is not initialized', async () => {
            const increaseTime = 60 * 60 * 24 * 750; // 750 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            // 0 - STAKING distribution type
            await expect(unmarshalTokenVesting.withdrawTokens(0))
                .to.be.revertedWith("not initialized");

        });

        it('Withdraw tokens if current time < initial timestemp', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 10; // 10 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            await unmarshalTokenVesting.withdrawTokens(0);

            // await expect(unmarshalTokenVesting.withdrawTokens(0))
            //     .to.be.revertedWith("no tokens available for withdrawl");
        });

        it('Reverted if not exists available tokens for the distribution type', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24; // 1 day
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            await expect(unmarshalTokenVesting.withdrawTokens(0))
                .to.be.revertedWith("no tokens available for withdrawl");
        });

        it('Successfully withdraw tokens by the distribution type', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 10; // 10 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const [beneficiary, withdrawnTokens, tokensAllotment, distributionType] = await unmarshalTokenVesting.distributionInfo(0);

            expect(await beneficiary).to.be.equal(stakingRewards.address);

            const availableAmount = await unmarshalTokenVesting.withdrawableTokens(distributionType);

            await unmarshalToken.approve(beneficiary, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(0);

            await expect(
                unmarshalTokenVesting.withdrawTokens(distributionType))
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(availableAmount);
        });

        it('Withdraw tokens when currect time > initial timestamp', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 5; // 5 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const [beneficiary, withdrawnTokens, tokensAllotment, distributionType] = await unmarshalTokenVesting.distributionInfo(2);

            expect(await beneficiary).to.be.equal(marketing.address);

            const availableAmount = await unmarshalTokenVesting.withdrawableTokens(distributionType);

            await unmarshalToken.approve(beneficiary, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(0);

            await expect(
                unmarshalTokenVesting.withdrawTokens(distributionType))
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(availableAmount);
        });

        it('Withdraw tokens when the distribution type is ECOSYSTEM', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 15; // 15 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const [beneficiary, withdrawnTokens, tokensAllotment, distributionType] = await unmarshalTokenVesting.distributionInfo(1);

            expect(await beneficiary).to.be.equal(ecosystem.address);

            const availableAmount = await unmarshalTokenVesting.withdrawableTokens(1);

            await unmarshalToken.approve(beneficiary, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(0);

            await expect(
                unmarshalTokenVesting.withdrawTokens(distributionType))
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, availableAmount);

            expect(await unmarshalToken.balanceOf()).to.be.equal(availableAmount);
        });

        it('Withdraw tokens when the distribution type is TEAM', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 240; // 240 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const [beneficiary, withdrawnTokens, tokensAllotment, distributionType] = await unmarshalTokenVesting.distributionInfo(4);

            expect(await beneficiary).to.be.equal(team.address);

            const availableAmount = await unmarshalTokenVesting.withdrawableTokens(4);

            await unmarshalToken.approve(beneficiary, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(0);

            await expect(
                unmarshalTokenVesting.withdrawTokens(distributionType))
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, availableAmount);

            expect(await unmarshalToken.balanceOf()).to.be.equal(availableAmount);
        });

        it('Withdraw tokens when the distribution type is TEAM and current time >= initial cliff (241 days)', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 245; // 245 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const [beneficiary, withdrawnTokens, tokensAllotment, distributionType] = await unmarshalTokenVesting.distributionInfo(4);

            expect(await beneficiary).to.be.equal(team.address);

            const availableAmount = await unmarshalTokenVesting.withdrawableTokens(4);

            await unmarshalToken.approve(beneficiary, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(0);

            await expect(
                unmarshalTokenVesting.withdrawTokens(distributionType))
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, availableAmount);

            expect(await unmarshalToken.balanceOf()).to.be.equal(availableAmount);
        });

        it('Withdraw tokens when the distribution type is TEAM and current time < vesting period (661 days)', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 662; // 662 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const [beneficiary, withdrawnTokens, tokensAllotment, distributionType] = await unmarshalTokenVesting.distributionInfo(4);

            expect(await beneficiary).to.be.equal(team.address);

            const availableAmount = await unmarshalTokenVesting.withdrawableTokens(4);

            await unmarshalToken.approve(beneficiary, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(0);

            await expect(
                unmarshalTokenVesting.withdrawTokens(distributionType))
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, availableAmount);

            expect(await unmarshalToken.balanceOf()).to.be.equal(availableAmount);
        });

        it('Withdraw tokens when the distribution type is TEAM and current time > initial cliff (241 days) and current time < vesting period (661 days)', async () => {
            await unmarshalTokenVesting.setInitialTimestamp(newTimestamp);

            const increaseTime = 60 * 60 * 24 * 245; // 245 days
            await ethers.provider.send("evm_increaseTime", [increaseTime]);
            await ethers.provider.send("evm_mine", []);

            const [beneficiary, withdrawnTokens, tokensAllotment, distributionType] = await unmarshalTokenVesting.distributionInfo(4);

            expect(await beneficiary).to.be.equal(team.address);

            const availableAmount = await unmarshalTokenVesting.withdrawableTokens(4);

            await unmarshalToken.approve(beneficiary, availableAmount);

            expect(await unmarshalToken.balanceOf(beneficiary)).to.be.equal(0);

            await expect(
                unmarshalTokenVesting.withdrawTokens(distributionType))
                .to.emit(privateDistribution, 'WithdrawnTokens')
                .withArgs(investor1.address, availableAmount);

            expect(await unmarshalToken.balanceOf()).to.be.equal(availableAmount);
        });

    });

    describe('recoverExcessToken', async () => {
        it('Reverted if caller is not owner', async () => {
            const recoverAmount = ethers.BigNumber.from("1000");
            await unmarshalTokenMock.connect(investor1).approve(owner.address, recoverAmount);
            await expect(unmarshalTokenVesting.connect(investor1).recoverExcessToken(unmarshalTokenMock.address, recoverAmount))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('Successfully recoverExcessToken', async () => {
            const recoverAmount = ethers.BigNumber.from("1000");
            await unmarshalTokenMock.connect(investor1).approve(owner.address, recoverAmount);
            await expect(
                unmarshalTokenVesting.recoverExcessToken(unmarshalTokenMock.address, recoverAmount))
                .to.emit(unmarshalTokenVesting, 'RecoverToken')
                .withArgs(unmarshalTokenMock.address, recoverAmount);
        });

    });

});