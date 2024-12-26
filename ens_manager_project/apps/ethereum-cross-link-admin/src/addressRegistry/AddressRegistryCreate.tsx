import * as React from "react";
import { Create, SimpleForm, CreateProps, TextInput } from "react-admin";

export const AddressRegistryCreate = (
  props: CreateProps
): React.ReactElement => {
  return (
    <Create {...props}>
      <SimpleForm>
        <TextInput label="RegistryAddress" source="registryAddress" />
        <TextInput label="RegistryName" source="registryName" />
      </SimpleForm>
    </Create>
  );
};
