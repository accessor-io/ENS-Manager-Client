// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IRegistry {
    function register(bytes32 hash, address resolver) external;
    function updateResolver(bytes32 hash, address newResolver) external;
    function getResolver(bytes32 hash) external view returns (address);
    function isRegistered(bytes32 hash) external view returns (bool);
}

contract Registry is IRegistry, Ownable {
    // Mapping to store the resolver addresses for each hash
    mapping(bytes32 => address) private resolvers;

    // Event to emit when a resolver is registered
    event Registered(bytes32 indexed hash, address indexed resolver);
    // Event to emit when a resolver is updated
    event ResolverUpdated(bytes32 indexed hash, address indexed oldResolver, address indexed newResolver);

    /**
     * @dev Registers a resolver address for a given hash.
     * @param hash The hash to associate with the resolver address.
     * @param resolver The resolver address to register.
     */
    function register(bytes32 hash, address resolver) external onlyOwner override {
        require(resolvers[hash] == address(0), "Already registered");
        require(resolver != address(0), "Invalid resolver address");

        resolvers[hash] = resolver;
        emit Registered(hash, resolver);
    }

    /**
     * @dev Updates the resolver address for a given hash.
     * @param hash The hash to update.
     * @param newResolver The new resolver address.
     */
    function updateResolver(bytes32 hash, address newResolver) external onlyOwner override {
        require(resolvers[hash] != address(0), "Not registered");
        require(newResolver != address(0), "Invalid resolver address");

        address oldResolver = resolvers[hash];
        resolvers[hash] = newResolver;
        emit ResolverUpdated(hash, oldResolver, newResolver);
    }

    /**
     * @dev Retrieves the resolver address for a given hash.
     * @param hash The hash to query.
     * @return The resolver address associated with the hash.
     */
    function getResolver(bytes32 hash) external view override returns (address) {
        return resolvers[hash];
    }

    /**
     * @dev Checks if a hash is registered.
     * @param hash The hash to check.
     * @return True if the hash is registered, false otherwise.
     */
    function isRegistered(bytes32 hash) external view override returns (bool) {
        return resolvers[hash] != address(0);
    }
}
