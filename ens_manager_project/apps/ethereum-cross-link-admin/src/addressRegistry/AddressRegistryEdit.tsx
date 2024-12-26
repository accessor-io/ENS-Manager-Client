import * as React from "react";
import { Edit, SimpleForm, EditProps, TextInput } from "react-admin";

export const AddressRegistryEdit = (props: EditProps): React.ReactElement => {
  return (
    <Edit {...props}>
      <SimpleForm>
        <TextInput label="RegistryAddress" source="registryAddress" />
        <TextInput label="RegistryName" source="registryName" />
      </SimpleForm>
    </Edit>
  );
};
