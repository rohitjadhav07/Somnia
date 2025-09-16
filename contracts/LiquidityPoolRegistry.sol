// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/ILiquidityPool.sol";

contract LiquidityPoolRegistry is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    struct PoolInfo {
        address poolAddress;
        address token0;
        address token1;
        uint256 fee; // Fee in basis points (100 = 1%)
        bool isActive;
        uint256 totalVolume;
        uint256 totalFees;
        uint256 registeredAt;
    }

    struct PoolMetrics {
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalSupply;
        uint256 lastUpdated;
    }

    mapping(address => PoolInfo) public pools;
    mapping(bytes32 => address) public poolsByTokenPair;
    address[] public registeredPools;
    
    mapping(address => PoolMetrics) public poolMetrics;
    mapping(address => mapping(address => bool)) public authorizedRouters;

    uint256 public protocolFee; // Protocol fee in basis points
    address public feeRecipient;
    uint256 public totalProtocolFees;

    event PoolRegistered(
        address indexed pool,
        address indexed token0,
        address indexed token1,
        uint256 fee
    );
    
    event PoolDeactivated(address indexed pool);
    event PoolActivated(address indexed pool);
    event RouterAuthorized(address indexed router, address indexed pool);
    event RouterDeauthorized(address indexed router, address indexed pool);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);
    event PoolMetricsUpdated(address indexed pool, uint256 reserve0, uint256 reserve1);

    function initialize(address _feeRecipient, uint256 _protocolFee) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        
        feeRecipient = _feeRecipient;
        protocolFee = _protocolFee;
    }

    function registerPool(
        address _pool,
        uint256 _fee
    ) external onlyOwner {
        require(_pool != address(0), "Invalid pool address");
        require(!pools[_pool].isActive, "Pool already registered");
        require(_fee <= 10000, "Fee too high"); // Max 100%

        ILiquidityPool pool = ILiquidityPool(_pool);
        address token0 = pool.token0();
        address token1 = pool.token1();
        
        bytes32 pairKey = _getPairKey(token0, token1);
        require(poolsByTokenPair[pairKey] == address(0), "Pair already has registered pool");

        pools[_pool] = PoolInfo({
            poolAddress: _pool,
            token0: token0,
            token1: token1,
            fee: _fee,
            isActive: true,
            totalVolume: 0,
            totalFees: 0,
            registeredAt: block.timestamp
        });

        poolsByTokenPair[pairKey] = _pool;
        registeredPools.push(_pool);
        
        _updatePoolMetrics(_pool);

        emit PoolRegistered(_pool, token0, token1, _fee);
    }

    function deactivatePool(address _pool) external onlyOwner {
        require(pools[_pool].isActive, "Pool not active");
        pools[_pool].isActive = false;
        emit PoolDeactivated(_pool);
    }

    function activatePool(address _pool) external onlyOwner {
        require(pools[_pool].poolAddress != address(0), "Pool not registered");
        require(!pools[_pool].isActive, "Pool already active");
        pools[_pool].isActive = true;
        emit PoolActivated(_pool);
    }

    function authorizeRouter(address _router, address _pool) external onlyOwner {
        require(pools[_pool].isActive, "Pool not active");
        authorizedRouters[_router][_pool] = true;
        emit RouterAuthorized(_router, _pool);
    }

    function deauthorizeRouter(address _router, address _pool) external onlyOwner {
        authorizedRouters[_router][_pool] = false;
        emit RouterDeauthorized(_router, _pool);
    }

    function updateProtocolFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = protocolFee;
        protocolFee = _newFee;
        emit ProtocolFeeUpdated(oldFee, _newFee);
    }

    function updatePoolMetrics(address _pool) external {
        require(pools[_pool].isActive, "Pool not active");
        _updatePoolMetrics(_pool);
    }

    function recordSwap(
        address _pool,
        uint256 _volume,
        uint256 _fee
    ) external {
        require(authorizedRouters[msg.sender][_pool], "Unauthorized router");
        require(pools[_pool].isActive, "Pool not active");

        pools[_pool].totalVolume += _volume;
        pools[_pool].totalFees += _fee;
        
        uint256 protocolFeeAmount = (_fee * protocolFee) / 10000;
        totalProtocolFees += protocolFeeAmount;
    }

    function getPoolByTokens(address _token0, address _token1) external view returns (address) {
        bytes32 pairKey = _getPairKey(_token0, _token1);
        return poolsByTokenPair[pairKey];
    }

    function getActivePools() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < registeredPools.length; i++) {
            if (pools[registeredPools[i]].isActive) {
                activeCount++;
            }
        }

        address[] memory activePools = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < registeredPools.length; i++) {
            if (pools[registeredPools[i]].isActive) {
                activePools[index] = registeredPools[i];
                index++;
            }
        }

        return activePools;
    }

    function getPoolInfo(address _pool) external view returns (PoolInfo memory) {
        return pools[_pool];
    }

    function getPoolMetrics(address _pool) external view returns (PoolMetrics memory) {
        return poolMetrics[_pool];
    }

    function getTotalPools() external view returns (uint256) {
        return registeredPools.length;
    }

    function _updatePoolMetrics(address _pool) internal {
        ILiquidityPool pool = ILiquidityPool(_pool);
        (uint256 reserve0, uint256 reserve1) = pool.getReserves();
        uint256 totalSupply = pool.totalSupply();

        poolMetrics[_pool] = PoolMetrics({
            reserve0: reserve0,
            reserve1: reserve1,
            totalSupply: totalSupply,
            lastUpdated: block.timestamp
        });

        emit PoolMetricsUpdated(_pool, reserve0, reserve1);
    }

    function _getPairKey(address _token0, address _token1) internal pure returns (bytes32) {
        return _token0 < _token1 
            ? keccak256(abi.encodePacked(_token0, _token1))
            : keccak256(abi.encodePacked(_token1, _token0));
    }
}