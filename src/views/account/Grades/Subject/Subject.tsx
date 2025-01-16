import type { RouteParameters } from "@/router/helpers/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Grade, GradesPerSubject } from "@/services/shared/Grade";
import { NativeListHeader, NativeText } from "@/components/Global/NativeComponents";
import { animPapillon } from "@/utils/ui/animations";
import Reanimated, { FadeInRight, FadeOutLeft, LinearTransition } from "react-native-reanimated";
import { FlatList, View } from "react-native";
import SubjectItem from "./SubjectList";
import { useCallback, useMemo, useState } from "react";
import PapillonPicker, { PickerDataItem } from "@/components/Global/PapillonPicker";
import { ArrowDownAZ, Calendar, ChevronDown, TrendingUp } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";

interface SubjectProps {
  allGrades: Grade[]
  gradesPerSubject: GradesPerSubject[]
  navigation: NativeStackNavigationProp<RouteParameters, keyof RouteParameters>
}

const sortings: PickerDataItem[] = [
  {
    label: "Alphabétique",
    icon: <ArrowDownAZ />,
  },
  {
    label: "Date",
    icon: <Calendar />,
  },
  {
    label: "Moyenne",
    icon: <TrendingUp />,
  },
];

const Subject: React.FC<SubjectProps> = ({
  gradesPerSubject,
  navigation,
  allGrades
}) => {
  const [sorting, setSorting] = useState(0);
  const theme = useTheme();

  const sortedData = useMemo(() => {
    return gradesPerSubject.sort((a, b) => {
      if (sorting === 0) {
        return a.average.subjectName.localeCompare(b.average.subjectName);
      } else if (sorting === 1) {
        return b.grades[0].timestamp - a.grades[0].timestamp;
      } else {
        return (b.average?.average?.value || 0) - (a.average?.average?.value || 0);
      }
    });
  }, [gradesPerSubject, sorting]);

  const renderItem = useCallback(({ item, index }: { item: GradesPerSubject; index: number }) => (
    <SubjectItem
      key={item.average.subjectName + index}
      index={index}
      subject={item}
      navigation={navigation}
      allGrades={allGrades}
    />
  ), [navigation, allGrades]);

  const ListHeaderComponent = useCallback(() => (
    <NativeListHeader
      label="Mes notes"
      trailing={(
        <PapillonPicker
          data={sortings}
          selected={sortings[sorting]}
          onSelectionChange={(item) => {
            setSorting(sortings.indexOf(item));
          }}
          direction="right"
        >
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 5,
              alignSelf: "flex-end",
              flex: 1,
            }}
          >
            <NativeText
              animated
              entering={animPapillon(FadeInRight)}
              exiting={animPapillon(FadeOutLeft)}
              style={{
                opacity: 1,
                color: theme.colors.primary,
                fontSize: 13,
                fontFamily: "semibold",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {sortings[sorting].label}
            </NativeText>
            <ChevronDown
              size={20}
              strokeWidth={2.5}
              color={theme.colors.primary}
            />
          </View>
        </PapillonPicker>
      )}
    />
  ), [sorting, theme.colors.primary]);

  const keyExtractor = useCallback((item: GradesPerSubject, index: number) =>
    item.average.subjectName + index,
  []);

  return (
    <Reanimated.View
      layout={animPapillon(LinearTransition)}
    >
      <FlatList
        data={sortedData}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListHeaderComponentStyle={{zIndex: 99}}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={5}
      />
    </Reanimated.View>
  );
};

export default Subject;