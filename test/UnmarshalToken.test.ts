import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from 'ethers'
import chai from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)

describe("UnmarshallToken", () => {
    let unmarshalToken: Contract
    let unmarshalTokenMock: Contract

    let owner: SignerWithAddress
    let governance: SignerWithAddress
    let beneficiary1: SignerWithAddress
    let otherAccounts: SignerWithAddress[]

    let name: string = "UnmarshalToken"
    let nameMock: string = "UnmarshalTokenMock"
    let symbol: string = "MARSH"
    let symbolMock: string = "MARSHM"

    beforeEach(async () => {
        [owner, governance, beneficiary1, ...otherAccounts] = await ethers.getSigners();

        const UnmarshalToken = await ethers.getContractFactory('UnmarshalToken');
        const UnmarshalTokenMock = await ethers.getContractFactory('UnmarshalTokenMock');
        unmarshalToken = await UnmarshalToken.deploy();
        unmarshalTokenMock = await UnmarshalTokenMock.deploy();
    });

    describe('Deploy contracts', async () => {
        it('Contracts not to be underfined, null and NaN', async () => {
            expect(unmarshalToken.address).to.be.not.undefined;
            expect(unmarshalToken.address).to.be.not.null;
            expect(unmarshalToken.address).to.be.not.NaN;
        });

        it('Initialize name and symbol correct', async () => {
            expect(await unmarshalToken.name()).to.be.equal(name);
            expect(await unmarshalToken.symbol()).to.be.equal(symbol);

            expect(await unmarshalTokenMock.name()).to.be.equal(nameMock);
            expect(await unmarshalTokenMock.symbol()).to.be.equal(symbolMock);
        });

        it('Initialize totalSupply and balance of the owner correct', async () => {
            let totalSupply = "100000000000000000000000000";
            expect(await unmarshalToken.totalSupply()).to.be.equal(ethers.BigNumber.from(totalSupply));
            expect(await unmarshalToken.MAX_CAP()).to.be.equal(ethers.BigNumber.from(totalSupply));
            expect(await unmarshalToken.balanceOf(owner.address)).to.be.equal(ethers.BigNumber.from(totalSupply));

            expect(await unmarshalTokenMock.totalSupply()).to.be.equal(ethers.BigNumber.from(totalSupply));
            expect(await unmarshalTokenMock.MAX_CAP()).to.be.equal(ethers.BigNumber.from(totalSupply));
            expect(await unmarshalTokenMock.balanceOf(owner.address)).to.be.equal(ethers.BigNumber.from(totalSupply));
        });

        it('Initialize owner as governance', async () => {
            expect(await unmarshalToken.governance()).to.be.equal(owner.address);
        });

    });

    describe('setGovernance', async () => {
        it('Reverted if caller is not governance address', async () => {
            await expect(unmarshalToken.connect(beneficiary1).setGovernance(governance.address))
                .to.be.revertedWith("!governance");
        });

        it('Set new governance correctly', async () => {
            await unmarshalToken.setGovernance(governance.address);
            expect(await unmarshalToken.governance()).to.be.equal(governance.address);
        });

        it('Possible to set the same address for setGovernance ', async () => {
            await unmarshalToken.setGovernance(owner.address);
            expect(await unmarshalToken.governance()).to.be.equal(owner.address);
        });

    });

    describe('recoverToken', async () => {
        it('Reverted if caller is not governance address', async () => {
            await expect(unmarshalToken.connect(beneficiary1).recoverToken(unmarshalToken.address, beneficiary1.address, ethers.BigNumber.from("1000")))
                .to.be.revertedWith("!governance");
        });

        it('Reverted if token address the same as destination address', async () => {
            await expect(unmarshalToken.recoverToken(beneficiary1.address, beneficiary1.address, ethers.BigNumber.from("1000")))
                .to.be.revertedWith("Invalid address");
        });

        it('Reverted if retrive failed', async () => {
            const recoverAmount = ethers.BigNumber.from("1000");
            await unmarshalToken.approve(unmarshalTokenMock.address, recoverAmount);
            await unmarshalToken.transfer(unmarshalTokenMock.address, recoverAmount);
            await expect(unmarshalToken.recoverToken(unmarshalTokenMock.address, beneficiary1.address, ethers.BigNumber.from("1000")))
                .to.be.revertedWith("Retrieve failed");
        });

        it('Recover token successfully', async () => {
            const recoverAmount = ethers.BigNumber.from("1000");
            await unmarshalToken.approve(unmarshalToken.address, recoverAmount);
            await unmarshalToken.transfer(unmarshalToken.address, recoverAmount);
            await expect(
                unmarshalToken.recoverToken(unmarshalToken.address, beneficiary1.address, recoverAmount))
                .to.emit(unmarshalToken, 'RecoverToken')
                .withArgs(unmarshalToken.address, beneficiary1.address, recoverAmount);
        });

    });

});