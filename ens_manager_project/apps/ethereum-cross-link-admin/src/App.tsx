import React, { useEffect, useState } from "react";
import { Admin, DataProvider, Resource } from "react-admin";
import buildGraphQLProvider from "./data-provider/graphqlDataProvider";
import { theme } from "./theme/theme";
import Login from "./Login";
import "./App.scss";
import Dashboard from "./pages/Dashboard";
import { CcipCrossChainBridgeList } from "./ccipCrossChainBridge/CcipCrossChainBridgeList";
import { CcipCrossChainBridgeCreate } from "./ccipCrossChainBridge/CcipCrossChainBridgeCreate";
import { CcipCrossChainBridgeEdit } from "./ccipCrossChainBridge/CcipCrossChainBridgeEdit";
import { CcipCrossChainBridgeShow } from "./ccipCrossChainBridge/CcipCrossChainBridgeShow";
import { RegistryList } from "./registry/RegistryList";
import { RegistryCreate } from "./registry/RegistryCreate";
import { RegistryEdit } from "./registry/RegistryEdit";
import { RegistryShow } from "./registry/RegistryShow";
import { AddressRegistryList } from "./addressRegistry/AddressRegistryList";
import { AddressRegistryCreate } from "./addressRegistry/AddressRegistryCreate";
import { AddressRegistryEdit } from "./addressRegistry/AddressRegistryEdit";
import { AddressRegistryShow } from "./addressRegistry/AddressRegistryShow";
import { AttestationManagerList } from "./attestationManager/AttestationManagerList";
import { AttestationManagerCreate } from "./attestationManager/AttestationManagerCreate";
import { AttestationManagerEdit } from "./attestationManager/AttestationManagerEdit";
import { AttestationManagerShow } from "./attestationManager/AttestationManagerShow";
import { GovernorList } from "./governor/GovernorList";
import { GovernorCreate } from "./governor/GovernorCreate";
import { GovernorEdit } from "./governor/GovernorEdit";
import { GovernorShow } from "./governor/GovernorShow";
import { ResolverList } from "./resolver/ResolverList";
import { ResolverCreate } from "./resolver/ResolverCreate";
import { ResolverEdit } from "./resolver/ResolverEdit";
import { ResolverShow } from "./resolver/ResolverShow";
import { OracleList } from "./oracle/OracleList";
import { OracleCreate } from "./oracle/OracleCreate";
import { OracleEdit } from "./oracle/OracleEdit";
import { OracleShow } from "./oracle/OracleShow";
import { ProjectRegistryList } from "./projectRegistry/ProjectRegistryList";
import { ProjectRegistryCreate } from "./projectRegistry/ProjectRegistryCreate";
import { ProjectRegistryEdit } from "./projectRegistry/ProjectRegistryEdit";
import { ProjectRegistryShow } from "./projectRegistry/ProjectRegistryShow";
import { jwtAuthProvider } from "./auth-provider/ra-auth-jwt";

const App = (): React.ReactElement => {
  const [dataProvider, setDataProvider] = useState<DataProvider | null>(null);
  useEffect(() => {
    buildGraphQLProvider
      .then((provider: any) => {
        setDataProvider(() => provider);
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, []);
  if (!dataProvider) {
    return <div>Loading</div>;
  }
  return (
    <div className="App">
      <Admin
        title={"Ethereum Cross Link"}
        dataProvider={dataProvider}
        authProvider={jwtAuthProvider}
        theme={theme}
        dashboard={Dashboard}
        loginPage={Login}
      >
        <Resource
          name="CcipCrossChainBridge"
          list={CcipCrossChainBridgeList}
          edit={CcipCrossChainBridgeEdit}
          create={CcipCrossChainBridgeCreate}
          show={CcipCrossChainBridgeShow}
        />
        <Resource
          name="Registry"
          list={RegistryList}
          edit={RegistryEdit}
          create={RegistryCreate}
          show={RegistryShow}
        />
        <Resource
          name="AddressRegistry"
          list={AddressRegistryList}
          edit={AddressRegistryEdit}
          create={AddressRegistryCreate}
          show={AddressRegistryShow}
        />
        <Resource
          name="AttestationManager"
          list={AttestationManagerList}
          edit={AttestationManagerEdit}
          create={AttestationManagerCreate}
          show={AttestationManagerShow}
        />
        <Resource
          name="Governor"
          list={GovernorList}
          edit={GovernorEdit}
          create={GovernorCreate}
          show={GovernorShow}
        />
        <Resource
          name="Resolver"
          list={ResolverList}
          edit={ResolverEdit}
          create={ResolverCreate}
          show={ResolverShow}
        />
        <Resource
          name="Oracle"
          list={OracleList}
          edit={OracleEdit}
          create={OracleCreate}
          show={OracleShow}
        />
        <Resource
          name="ProjectRegistry"
          list={ProjectRegistryList}
          edit={ProjectRegistryEdit}
          create={ProjectRegistryCreate}
          show={ProjectRegistryShow}
        />
      </Admin>
    </div>
  );
};

export default App;
