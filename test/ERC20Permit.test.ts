import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { constants } from "@openzeppelin/test-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from 'ethers'
import chai from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity)

describe("ERC20Permit", () => {
    let unmarshalToken: Contract
    let unmarshalTokenMock: Contract
    let erc20permit: Contract

    let owner: SignerWithAddress
    let investor1: SignerWithAddress
    let investor2: SignerWithAddress
    let investor3: SignerWithAddress
    let otherAccounts: SignerWithAddress[]

    beforeEach(async () => {
        [owner, investor1, investor2, investor3, ...otherAccounts] = await ethers.getSigners();

        const UnmarshalToken = await ethers.getContractFactory('UnmarshalToken');
        const UnmarshalTokenMock = await ethers.getContractFactory('UnmarshalTokenMock');
        const ERC20Permit = await ethers.getContractFactory('ERC20Permit');
        unmarshalToken = await UnmarshalToken.deploy();
        unmarshalTokenMock = await UnmarshalTokenMock.connect(investor1).deploy();
        erc20permit = await ERC20Permit.deploy();
    });

    describe('Deploy contracts', async () => {
        it('Contracts not to be underfined, null and NaN', async () => {
            expect(erc20permit.address).to.be.not.undefined;
            expect(erc20permit.address).to.be.not.null;
            expect(erc20permit.address).to.be.not.NaN;
        });

    });
});