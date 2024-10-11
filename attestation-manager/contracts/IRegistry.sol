// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRegistry {
    function register(bytes32 hash, address resolver) external;
    function getResolver(bytes32 hash) external view returns (address);
}

contract Registry is IRegistry {
    // Mapping to store the resolver addresses for each hash
    mapping(bytes32 => address) private resolvers;

    // Event to emit when a resolver is registered
    event ResolverRegistered(bytes32 indexed hash, address indexed resolver);

    /**
     * @dev Registers a resolver address for a given hash.
     * @param hash The hash to associate with the resolver address.
     * @param resolver The resolver address to register.
     */
    function register(bytes32 hash, address resolver) external override {
        // Ensure the hash is not already registered
        require(resolvers[hash] == address(0), "Resolver already registered");

        // Register the resolver address
        resolvers[hash] = resolver;

        // Emit an event for the resolver registration
        emit ResolverRegistered(hash, resolver);
    }

    /**
     * @dev Retrieves the resolver address for a given hash.
     * @param hash The hash to query.
     * @return The resolver address associated with the hash.
     */
    function getResolver(bytes32 hash) external view override returns (address) {
        return resolvers[hash];
    }
}
