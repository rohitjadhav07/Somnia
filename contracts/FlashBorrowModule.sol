// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IFlashBorrower.sol";
import "./LiquidityPoolRegistry.sol";

contract FlashBorrowModule is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    LiquidityPoolRegistry public registry;
    
    uint256 public flashLoanFee; // Fee in basis points (100 = 1%)
    uint256 public totalFlashLoans;
    uint256 public totalFlashLoanVolume;
    
    mapping(address => uint256) public tokenBalances;
    mapping(address => bool) public supportedTokens;
    address[] public supportedTokensList;

    bytes32 private constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");

    event FlashLoan(
        address indexed borrower,
        address indexed token,
        uint256 amount,
        uint256 fee,
        bytes32 indexed txHash
    );
    
    event TokenSupported(address indexed token);
    event TokenUnsupported(address indexed token);
    event FlashLoanFeeUpdated(uint256 oldFee, uint256 newFee);
    event LiquidityDeposited(address indexed token, uint256 amount, address indexed depositor);
    event LiquidityWithdrawn(address indexed token, uint256 amount, address indexed recipient);

    modifier onlySupported(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    function initialize(
        address _registry,
        uint256 _flashLoanFee
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        
        registry = LiquidityPoolRegistry(_registry);
        flashLoanFee = _flashLoanFee;
    }

    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!supportedTokens[_token], "Token already supported");
        
        supportedTokens[_token] = true;
        supportedTokensList.push(_token);
        
        emit TokenSupported(_token);
    }

    function removeSupportedToken(address _token) external onlyOwner {
        require(supportedTokens[_token], "Token not supported");
        require(tokenBalances[_token] == 0, "Token has balance");
        
        supportedTokens[_token] = false;
        
        // Remove from array
        for (uint256 i = 0; i < supportedTokensList.length; i++) {
            if (supportedTokensList[i] == _token) {
                supportedTokensList[i] = supportedTokensList[supportedTokensList.length - 1];
                supportedTokensList.pop();
                break;
            }
        }
        
        emit TokenUnsupported(_token);
    }

    function depositLiquidity(address _token, uint256 _amount) external onlySupported(_token) {
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        tokenBalances[_token] += _amount;
        
        emit LiquidityDeposited(_token, _amount, msg.sender);
    }

    function withdrawLiquidity(
        address _token,
        uint256 _amount,
        address _recipient
    ) external onlyOwner onlySupported(_token) {
        require(_amount > 0, "Amount must be greater than 0");
        require(tokenBalances[_token] >= _amount, "Insufficient balance");
        require(_recipient != address(0), "Invalid recipient");
        
        tokenBalances[_token] -= _amount;
        IERC20(_token).safeTransfer(_recipient, _amount);
        
        emit LiquidityWithdrawn(_token, _amount, _recipient);
    }

    function flashLoan(
        address _token,
        uint256 _amount,
        bytes calldata _data
    ) external nonReentrant onlySupported(_token) {
        require(_amount > 0, "Amount must be greater than 0");
        require(tokenBalances[_token] >= _amount, "Insufficient liquidity");

        uint256 fee = (_amount * flashLoanFee) / 10000;
        uint256 balanceBefore = tokenBalances[_token];

        // Transfer tokens to borrower
        tokenBalances[_token] -= _amount;
        IERC20(_token).safeTransfer(msg.sender, _amount);

        // Call borrower callback
        require(
            IFlashBorrower(msg.sender).onFlashLoan(
                msg.sender,
                _token,
                _amount,
                fee,
                _data
            ) == CALLBACK_SUCCESS,
            "Flash loan callback failed"
        );

        // Ensure repayment with fee
        uint256 currentBalance = IERC20(_token).balanceOf(address(this));
        require(
            currentBalance >= balanceBefore + fee,
            "Flash loan not repaid with fee"
        );

        tokenBalances[_token] = currentBalance;
        totalFlashLoans++;
        totalFlashLoanVolume += _amount;

        emit FlashLoan(msg.sender, _token, _amount, fee, blockhash(block.number - 1));
    }

    function maxFlashLoan(address _token) external view returns (uint256) {
        if (!supportedTokens[_token]) {
            return 0;
        }
        return tokenBalances[_token];
    }

    function flashFee(address _token, uint256 _amount) external view returns (uint256) {
        require(supportedTokens[_token], "Token not supported");
        return (_amount * flashLoanFee) / 10000;
    }

    function updateFlashLoanFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = flashLoanFee;
        flashLoanFee = _newFee;
        emit FlashLoanFeeUpdated(oldFee, _newFee);
    }

    function getTokenBalance(address _token) external view returns (uint256) {
        return tokenBalances[_token];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokensList;
    }

    function getFlashLoanStats() external view returns (uint256, uint256) {
        return (totalFlashLoans, totalFlashLoanVolume);
    }

    // Emergency function to recover stuck tokens
    function emergencyWithdraw(address _token, address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(_token).safeTransfer(_recipient, balance);
            if (supportedTokens[_token]) {
                tokenBalances[_token] = 0;
            }
        }
    }
}