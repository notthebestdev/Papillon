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

  const loginUnivData = async (data: any) => {
    if (data?.uid) {
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

        name: `${data.family_name} ${data.given_name}`,
        studentName: {
          first: data.given_name,
          last: data.family_name,
        },
        className: data.supannEtuCursusAnnee?.[0] || "UPPA",
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
            if (document.getElementById('principalId')) {
              const principalData = {};
              const rows = document.querySelectorAll('#attributesTable tbody tr');
              rows.forEach(row => {
                const key = row.querySelector('td:first-child code kbd').textContent;
                const value = row.querySelector('td:last-child code kbd').textContent;
                principalData[key] = JSON.parse(value);
              });
              if (principalData.uid) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: "loginData", data: principalData}));
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
          if (data.type === "loginData") {
            loginUnivData(data.data);
          } else if (data.type === "loadingComplete") {
            setIsLoading(false);
          }
        }}
      />
    </View>
  );
};

export default UnivPau_Login;