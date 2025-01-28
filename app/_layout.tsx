import { Tabs } from "components/navigators/BottomTabs";

export default function App () {
  return (
    <Tabs>
      <Tabs.Screen
        name="lessons/index"
        options={{
          title: "Home",
          tabBarIcon: () => ({ sfSymbol: "house" }),
        }}
      />
      <Tabs.Screen
        name="grades/index"
        options={{
          title: "Explore",
          tabBarIcon: () => ({ sfSymbol: "person" }),
        }}
      />
    </Tabs>
  );
}
