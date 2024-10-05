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
  console.log("UnivPau_Login component initialized");
  const mainURL = "https://sso.univ-pau.fr/cas/login";
  const theme = useTheme();

  const webViewRef = React.useRef<WebView>(null);

  const createStoredAccount = useAccounts(store => store.create);
  const switchTo = useCurrentAccount(store => store.switchTo);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingText, setIsLoadingText] = React.useState("Connexion en cours...");

  const loginUnivData = async (data: any) => {
    console.log("loginUnivData function called with data:", JSON.stringify(data, null, 2));

    if (data?.uid && data?.name) {
      console.log("Valid uid and name found in data");
      const [firstName, ...lastNameParts] = data.name[0].split(" ");
      const lastName = lastNameParts.join(" ");
      console.log(`Parsed name: firstName=${firstName}, lastName=${lastName}`);

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

        name: data.name[0],
        studentName: {
          first: firstName,
          last: lastName,
        },
        className: data.supannEtuCursusAnnee?.[0] || "UPPA",
        schoolName: "Université de Pau et des Pays de l'Adour",

        personalization: await defaultPersonalization()
      };

      console.log("Created local_account:", JSON.stringify(local_account, null, 2));

      createStoredAccount(local_account);
      console.log("Stored account created");
      switchTo(local_account);
      console.log("Switched to new account");

      queueMicrotask(() => {
        console.log("Resetting navigation to AccountCreated");
        navigation.reset({
          index: 0,
          routes: [{ name: "AccountCreated" }],
        });
      });
    } else {
      console.log("Invalid data: missing uid or name");
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
        onLoadStart={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log("WebView load started:", nativeEvent.url);
        }}
        onLoadEnd={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log("WebView load ended:", nativeEvent.url);
          webViewRef.current?.injectJavaScript(`
            console.log("Injected JavaScript running");
            if (document.getElementById('fm1')) {
              console.log("Login form detected");
              document.getElementById('fm1').onsubmit = function() {
                console.log("Login form submitted");
                window.ReactNativeWebView.postMessage(JSON.stringify({type: "formSubmitted"}));
                return true;
              };
              window.ReactNativeWebView.postMessage(JSON.stringify({type: "loadingComplete"}));
            } else if (document.getElementById('principalId')) {
              console.log("Principal ID detected, parsing user data");
              const principalData = {};
              const rows = document.querySelectorAll('#attributesTable tbody tr');
              rows.forEach(row => {
                const key = row.querySelector('td:first-child code kbd').textContent;
                const value = row.querySelector('td:last-child code kbd').textContent;
                console.log("Parsing row:", key, value);
                try {
                  principalData[key] = JSON.parse(value);
                } catch (e) {
                  console.log("Error parsing JSON for key:", key, "Error:", e);
                  principalData[key] = value;
                }
              });
              console.log("Parsed principal data:", JSON.stringify(principalData, null, 2));
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "loginData", 
                data: principalData
              }));
            } else {
              console.log("Neither login form nor principal ID detected");
              window.ReactNativeWebView.postMessage(JSON.stringify({type: "loadingComplete"}));
            }
          `);
        }}
        onMessage={(event) => {
          console.log("Message received from WebView");
          const data = JSON.parse(event.nativeEvent.data);
          console.log("Parsed message data:", JSON.stringify(data, null, 2));
          switch (data.type) {
            case "formSubmitted":
              console.log("Form submitted, updating loading state");
              setIsLoadingText("Vérification des identifiants...");
              setIsLoading(true);
              break;
            case "loginData":
              console.log("Login data received, calling loginUnivData");
              loginUnivData(data.data);
              break;
            case "loadingComplete":
              console.log("Loading complete, hiding spinner");
              setIsLoading(false);
              break;
            default:
              console.log("Unknown message type:", data.type);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error:", nativeEvent);
        }}
      />
    </View>
  );
};

export default UnivPau_Login;