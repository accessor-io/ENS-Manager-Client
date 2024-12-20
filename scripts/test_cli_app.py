import pexpect

def test_cli_app():
    # Start the application
    child = pexpect.spawn('python3 -m ens_manager.cli_app', timeout=10)

    # Expect the main menu to appear
    child.expect('ENS Manager')
    print("Main menu appeared")

    # Navigate through the menu options
    child.sendline('1')  # Assuming '1' is the option for "Manage Providers"
    child.expect('Provider Management')
    print("Entered Provider Management")

    # Test adding a new provider
    child.sendline('1')  # Assuming '1' is the option for "Add new provider"
    child.expect('Select provider type:')
    print("Adding new provider")
    child.sendline('1')  # Select a provider type
    child.expect('Enter provider name:')
    child.sendline('TestProvider')
    child.expect('Enter API key:')
    child.sendline('TestAPIKey')
    child.expect('Added provider TestProvider')
    print("Provider added")

    # Test setting the active provider
    child.sendline('3')  # Assuming '3' is the option for "Set active provider"
    child.expect('Select active provider:')
    child.sendline('1')  # Select the provider to set as active
    child.expect('Set TestProvider as active provider')
    print("Provider set as active")

    # Exit the application
    child.sendline('5')  # Assuming '5' is the option to go back to the main menu
    child.sendline('q')  # Assuming 'q' is the option to quit
    print("Exited application")

    print("All tests passed!")

if __name__ == "__main__":
    test_cli_app() 