"""Example usage of the ENS Manager package."""

import asyncio
from rich.console import Console
from src.ens_operations import ENSManager

console = Console()

async def main():
    """Run example operations."""
    # Initialize ENS Manager
    manager = ENSManager(
        provider_url="https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
        private_key="YOUR-PRIVATE-KEY"  # Optional
    )
    
    # Example 1: Resolve ENS name
    console.print("\n[cyan]Example 1: Resolve ENS name[/cyan]")
    name = "vitalik.eth"
    address = await manager.resolve_name(name)
    console.print(f"Address for {name}: {address}")
    
    # Example 2: Reverse resolve address
    console.print("\n[cyan]Example 2: Reverse resolve address[/cyan]")
    test_address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    resolved_name = await manager.reverse_resolve(test_address)
    console.print(f"Name for {test_address}: {resolved_name}")
    
    # Example 3: Get owner
    console.print("\n[cyan]Example 3: Get owner[/cyan]")
    owner = await manager.get_owner(name)
    console.print(f"Owner of {name}: {owner}")
    
    # Example 4: Get text records
    console.print("\n[cyan]Example 4: Get text records[/cyan]")
    text_keys = ['email', 'url', 'avatar', 'description']
    for key in text_keys:
        value = await manager.get_text_record(name, key)
        console.print(f"{key}: {value}")
    
    # Example 5: Batch resolve names
    console.print("\n[cyan]Example 5: Batch resolve names[/cyan]")
    names = ["vitalik.eth", "ethereum.eth", "ens.eth"]
    results = await manager.batch_resolve(names)
    for name, addr in results.items():
        console.print(f"{name} -> {addr}")
    
    # Example 6: Validate names
    console.print("\n[cyan]Example 6: Validate names[/cyan]")
    test_names = [
        "valid-name.eth",
        "invalid..name.eth",
        "another.valid.eth",
        "not-valid@.eth"
    ]
    for test_name in test_names:
        is_valid = manager.validate_name(test_name)
        console.print(f"{test_name}: {'✓' if is_valid else '✗'}")

    # Example 7: Create subdomain
    console.print("\n[cyan]Example 7: Create subdomain[/cyan]")
    domain = "mydomain.eth"  # Must own this domain
    subdomain = "test"
    owner_address = "0x1234567890123456789012345678901234567890"
    success = await manager.create_subdomain(domain, subdomain, owner_address)
    console.print(f"Created subdomain: {'✓' if success else '✗'}")

    # Example 8: List subdomains
    console.print("\n[cyan]Example 8: List subdomains[/cyan]")
    subdomains = await manager.list_subdomains(domain)
    for sub in subdomains:
        console.print(f"Subdomain: {sub['name']}")
        console.print(f"  Owner: {sub['owner']}")
        console.print(f"  Resolver: {sub['resolver']}")
        console.print(f"  Address: {sub['address']}")
        console.print(f"  Created: {sub['created']}")

    # Example 9: Transfer subdomain
    console.print("\n[cyan]Example 9: Transfer subdomain[/cyan]")
    new_owner = "0x9876543210987654321098765432109876543210"
    success = await manager.transfer_subdomain(domain, subdomain, new_owner)
    console.print(f"Transferred subdomain: {'✓' if success else '✗'}")

    # Example 10: Batch create subdomains
    console.print("\n[cyan]Example 10: Batch create subdomains[/cyan]")
    subdomains_to_create = [
        {"name": "blog", "owner": "0x1111111111111111111111111111111111111111"},
        {"name": "docs", "owner": "0x2222222222222222222222222222222222222222"},
        {"name": "app", "owner": "0x3333333333333333333333333333333333333333"}
    ]
    results = await manager.batch_create_subdomains(domain, subdomains_to_create)
    for name, success in results.items():
        console.print(f"{name}: {'✓' if success else '✗'}")

    # Example 11: Export subdomains
    console.print("\n[cyan]Example 11: Export subdomains[/cyan]")
    # JSON format
    json_export = await manager.export_subdomains(domain, 'json')
    console.print("JSON Export:")
    console.print(json_export)
    
    # CSV format
    csv_export = await manager.export_subdomains(domain, 'csv')
    console.print("\nCSV Export:")
    console.print(csv_export)

if __name__ == "__main__":
    asyncio.run(main())
