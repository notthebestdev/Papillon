import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@react-navigation/native";

import type { Screen } from "@/router/helpers/types";
import { useAccounts, useCurrentAccount } from "@/stores/account";
import { AccountService, LocalAccount } from "@/stores/account/types";
import defaultPersonalization from "@/services/local/default-personalization";
import uuid from "@/utils/uuid-v4";
import PapillonSpinner from "@/components/Global/PapillonSpinner";
import { NativeText } from "@/components/Global/NativeComponents";

const UnivPau_Login: Screen<"UnivPau_Login"> = ({ navigation }) => {
  const mainURL = "https://sso.univ-pau.fr/cas/login";
  const theme = useTheme();

  const webViewRef = React.useRef<WebView>(null);

  const createStoredAccount = useAccounts(store => store.create);
  const switchTo = useCurrentAccount(store => store.switchTo);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingText, setIsLoadingText] = React.useState("Connexion en cours...");

  const loginUnivData = async (data: { name: string, uid: string }) => {
    if (data?.uid && data?.name) {
      const [firstName, ...lastNameParts] = data.name.split(" ");
      const lastName = lastNameParts.join(" ");

      const local_account: LocalAccount = {
        authentication: undefined,
        instance: undefined,

        identityProvider: {
          identifier: "univ-pau",
          name: "Université de Pau",
          rawData: data
        },

        localID: uuid(),
        service: AccountService.Local,

        isExternal: false,
        linkedExternalLocalIDs: [],

        name: data.name,
        studentName: {
          first: firstName,
          last: lastName,
        },
        className: "",
        schoolName: "Université de Pau et des Pays de l'Adour",

        personalization: await defaultPersonalization()
      };

      createStoredAccount(local_account);
      switchTo(local_account);

      queueMicrotask(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "AccountCreated" }],
        });
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.card,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            gap: 6,
          }}
        >
          <PapillonSpinner
            size={48}
            strokeWidth={5}
            color="#29947a"
            style={{
              marginBottom: 16,
              marginHorizontal: 26,
            }}
          />

          <NativeText variant="title" style={{textAlign: "center"}}>
            Connexion au compte UPPA
          </NativeText>

          <NativeText variant="subtitle" style={{textAlign: "center"}}>
            {isLoadingText}
          </NativeText>
        </View>
      )}

      <WebView
        source={{ uri: mainURL }}
        style={{ height: "100%", width: "100%" }}
        ref={webViewRef}
        startInLoadingState={true}
        incognito={true}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(`
            if (document.getElementById('fm1')) {
              // We're on the login page
              document.getElementById('fm1').onsubmit = function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: "formSubmitted"}));
                return true;
              };
              window.ReactNativeWebView.postMessage(JSON.stringify({type: "loadingComplete"}));
            } else if (document.getElementById('principalId')) {
              // We're on the successful login page
              const nameRow = Array.from(document.querySelectorAll('#attributesTable tbody tr')).find(row => 
                row.querySelector('td:first-child code kbd').textContent === 'name'
              );
              const uidRow = Array.from(document.querySelectorAll('#attributesTable tbody tr')).find(row => 
                row.querySelector('td:first-child code kbd').textContent === 'uid'
              );
              
              if (nameRow && uidRow) {
                const name = JSON.parse(nameRow.querySelector('td:last-child code kbd').textContent)[0];
                const uid = JSON.parse(uidRow.querySelector('td:last-child code kbd').textContent)[0];
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: "loginData", 
                  data: { name, uid }
                }));
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: "loadingComplete"}));
              }
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: "loadingComplete"}));
            }
          `);
        }}
        onMessage={(e) => {
          const data = JSON.parse(e.nativeEvent.data);
          switch (data.type) {
            case "formSubmitted":
              setIsLoadingText("Vérification des identifiants...");
              setIsLoading(true);
              break;
            case "loginData":
              loginUnivData(data.data);
              break;
            case "loadingComplete":
              setIsLoading(false);
              break;
          }
        }}
      />
    </View>
  );
};

export default UnivPau_Login;