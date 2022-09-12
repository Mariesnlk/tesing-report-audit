// SPDX-License-Identifier: MIT

pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Marsh Token
 * @dev Marsh ERC20 Token
 */
contract UnmarshalTokenMock is ERC20 {
    // not 125 million
    uint256 public constant MAX_CAP = 100 * (10**6) * (10**18); // 125 million

    constructor() ERC20("UnmarshalTokenMock", "MARSHM") {
        _mint(msg.sender, MAX_CAP);
    }

    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        return false;
    }
}
