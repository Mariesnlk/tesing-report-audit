# Manual Report

## Unresolved, High: Owner is able to withdraw distributions by recovering
In PrivateDistribution, UnmarshalTokenVesting Smart Contracts there are recoverToken(...), recoverExcessToken(...) functions that let the owner withdraw any amount of any token.
### Recommendation: Consider adding limitation that will prevent the owner from withdrawing more of the specified tokens than has been allocated to investors.

---

## Unresolved, High: Possibility of using all the gas of the block
In PrivateDistribution Smart Contracts there is addInvestors(...) function that could cause out-of-gas error (too many iterations in the loop).
### Recommendation: Consider adding a limitation of gasLeft() that will break the loop if it has less amount of gas that is needed for one iteration.

---

## Unresolved, High: Commented initialization
In UnmarshalTokenVesting smart contract there is setInitialTimestamp(...) function that sets initial timestamp as parameter and should marked param isItialized as true. But this line is commented and cannot be used as require in modifier in function withdrawTokens(..). So noone can call this function.
### Recommendation: Uncommented the line with marked param isItialized as true and move it below setted initialTimestamp.

---

## Unresolved, High: Internal visability for constructor
In ERC20Permit smart contract there is a constructor with the visability as internal. With internal visability the contract cannot be deployed. By default, the visability for constructor is public. 
### Recommendation: Removed visability for the constructor.

---

## Unresolved, High: Incorrect msg.sender
In PrivateDistribution and UnmarshalTokenVesting smart contracts there are used safeTransfer(...) functions where msg.sender is PrivateDistribution or UnmarshalTokenVesting contracts.
### Recommendation: Add in contracts approving to transfer tokens from contracts addresses or use delegatecall.

---

## Unresolved, Low: Unreachable require
In UnmarshalTokenVesting smart contracts there are function _addDistribution(...) with the visability internal and it is called only once in the constructor with unchanged parameters. Due to that require(_tokensAllotment > 0, "the investor allocation must be more than 0"); and require(distribution.tokensAllotment == 0, "investor already added"); have never been failed.
### Recommendation: delete these require or change the visability of the function _addDistribution(...)  from internal to public.

---

## Unresolved, Low: Useless file imports
There are useless imports that could be removed:
in UnmarshalToken.sol:
```
mport "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
```
in PrivateDistribution.sol:
```
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";
```
in UnmarshalTokenVesting.sol:
```
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol".
```
SafeMath functions could be not used in these Smart Contracts because Solidity compiler version 0.8.* or higher is able to correctly process over-/underflow values.
Also console.log(...) alerts should be removed.
### Recommendation: Consider removing imports for code optimization.

---

## Unresolved, Low: msg.sender usage
In UnmarshalToken Smart Contract at onlyOwner() modifier could be used _msgSender() function instead of  msg.sender because it is inherited from Context Smart Contract.
In addition, the _msgSender() function call requires less gas than  msg.sender.
### Recommendation: Consider changing msg.sender to _msgSender().

---

## Unresolved, Low: Lack of zero address check
In UnmarshalToken Smart Contract in setGovernance(...) and recoverToken(...) functions  should be provided requirement to check nonzero addresses.
In PrivateDistribution Smart Contract in constructor(...) function  should be provided requirement to check nonzero address for token.
In UnmarshalTokenVesting Smart Contract in constructor(...) function  should be provided requirement to check nonzero address for staking rewards, ecosystem, marketing, reserves and team.
### Recommendation: Consider adding requirements.

---

## Unresolved, Low: Chain id getter
In ERC20Permit Smart Contract  constructor there is an assembly block that gets chain id but in the Solidity compiler version 0.8.* or higher  block.chainid  is available. So you can get chain id like block timestamp or block number.
### Recommendation: Consider code optimization.

---

## Unresolved, Low: Function visibility optimization
In ERC20Permit Smart Contract function visibility for permit(...), nonces(...) functions should be marked as external. 
Visibility for ERC20Permit constructor is ignored. If you want the contract to be non-deployable, making it abstract is sufficient. Remove internal visibility.
In PrivateDistribution Smart Contract getInitialTimestamp()  function should be marked as external. Also withdrawableTokens(...) function can be optimized and marked as external using internal function in other functions.
In UnmarshalTokenVesting Smart Contract getInitialTimestamp()  function should be marked as external. Also withdrawableTokens(...) function can be optimized and marked as external using internal function in other functions.
### Recommendation: Consider visibility optimization.

---

## Unresolved, Low: Absence of error messages
BokkyPooBahsDateTimeLibrary function requirements have no error messages.
### Recommendation: Consider adding descriptions in requirements.

---

## Unresolved, Low: Absence of events
In UnmarshalToken Smart Contract setGovernance(...) function has no event to be emitted with new value.
In PrivateDistribution Smart Contract setInitialTimestamp(...) function has no event to be emitted with new value.
In UnmarshalTokenVesting Smart Contract setInitialTimestamp(...) function has no event to be emitted with new value.
### Recommendation: Consider adding events.

---

## Unresolved, Low: Useless event
In PrivateDistribution Smart Contract there is TransferInvestment(...) event that is not used in Smart Contract function.
### Recommendation: Consider removing event or adding functionality that will use this event.

---

## Unresolved, Low: Useless variable initialization
There are useless initializations:
in contract PrivateDistribution Smart Contract: 
```
uint256 private vestingMonth = 0;
bool public isInitialized = false;
bool public isFinalized = false;
in contract UnmarshalTokenVesting Smart Contract:
bool public isInitialized = false;
bool public isFinalized = false.
```
Zero and false values are default values to number and boolean types.
### Recommendation: Consider code optimization.

---

### Unresolved, Low: Lack of non-zero release amounts checking
In PrivateDistribution Smart Contract there is releaseTokens(...) function that uses withdrawableTokens(...) equality requirement but does not check returned amount.
### Recommendation: Consider checking that the result of withdrawableTokens(...) is not zero.

---

## Unresolved, Low: Useless type conversion
In PrivateDistribution Smart Contract there is addInvestors(...), _addInvestor(...) functions with [] _allocationTypes, _allocationType arguments but marked as uint256 type. It is converted to AllocationType type in _addInvestor(...) function.
### Recommendation: Change types of _allocationTypes, _allocationType arguments from uint256 to AllocationType to avoid type conversion.

---

## Unresolved, Low: Lack of array size checking
In PrivateDistribution Smart Contract there is addInvestors(...) function that has equality requirement for _investors and _tokenAllocations but has no checking for _allocationTypes. It could lead to errors.
### Recommendation: Complete the check.

---

## Unresolved, Low: Lack of start vesting date checking
In PrivateDistribution, UnmarshalTokenVesting Smart Contracts there is setInitialTimestamp(...) function that is able to set timestamp value less than current timestamp.
### Recommendation: Add a requirement to check that the timestamp value is bigger than the current timestamp.

---

## Unresolved, Informational: Incorrect order of variables and functions
Functions should be grouped according to their visibility and ordered:
```
constructor;
fallback function (if exists);
external;
public;
internal;
private.
```
Inside each contract, library or interface, use the following order:
```
Type declarations;
State variables;
Events;
Functions.
```
### Recommendation: Consider changing functions and variables order in contract.

---

## Unresolved, Informational: Missed NatSpec documentation
There are some functions, state variables, events and contracts without NatSpec documentation.
### Recommendation: Consider adding missed NatSpec documentation.

---

## Unresolved, Informational: Default state visibility
In UnmarshalTokenVesting Smart Contract there are ecosystemVesting, marketingReserveVesting variables that have not marked visibility modifier (internal by default).
In BokkyPooBahsDateTimeLibrary there are SECONDS_PER_DAY, SECONDS_PER_HOUR, SECONDS_PER_MINUTE, OFFSET19700101, DOW_MON, DOW_TUE, DOW_WED, DOW_THU, DOW_FRI, DOW_SAT, DOW_SUN constants that have not marked visibility modifier (internal by default).
### Recommendation: Consider adding visibility modifiers.

---

## Unresolved, Informational: Naming style
BokkyPooBahsDateTimeLibrary constants should be named with all capital letters with underscores separating words. Examples: MAX_BLOCKS, TOKEN_NAME, TOKEN_TICKER, CONTRACT_VERSION. Constants are private by default in this library so they should start with _.
In ERC20Permit Smart Contract DOMAIN_SEPARATOR variable should be in mixed case. 
In PrivateDistribution Smart Contract vestingMonth should start with _ (private visibility).
In UnmarshalTokenVesting Smart Contract ecosystemVesting, marketingReserveVesting should start with _ (private visibility by default).
### Recommendation: Consider naming style.
 
