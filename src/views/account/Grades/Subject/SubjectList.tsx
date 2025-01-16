import {
  NativeItem,
  NativeList,
  NativeText,
} from "@/components/Global/NativeComponents";
import { getSubjectData } from "@/services/shared/Subject";
import { animPapillon } from "@/utils/ui/animations";
import React, { useCallback, useMemo, memo } from "react";
import { FlatList, View } from "react-native";
import Reanimated, {
  FadeInUp,
  FadeOutDown,
} from "react-native-reanimated";
import SubjectTitle from "./SubjectTitle";
import { type Grade, type GradesPerSubject } from "@/services/shared/Grade";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteParameters } from "@/router/helpers/types";

interface SubjectItemProps {
  subject: GradesPerSubject;
  index?: number;
  allGrades: Grade[];
  navigation: NativeStackNavigationProp<RouteParameters, keyof RouteParameters>;
}

const formatGradeDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const SubjectGradeItem = memo<SubjectGradeItemProps>(({ subject, grade, index, onPress }) => {
  const formattedDate = useMemo(() => formatGradeDate(grade.timestamp), [grade.timestamp]);
  const gradeValue = useMemo(() => {
    if (grade.student.disabled) return "N. not";
    return typeof grade.student.value === "number"
      ? grade.student.value.toFixed(2)
      : "N. not";
  }, [grade.student.disabled, grade.student.value]);

  return (
    <Reanimated.View key={grade.id + index}>
      <NativeItem
        separator={index < subject.grades.length - 1}
        chevron={false}
        onPress={onPress}
      >
        <View style={styles.gradeItemContainer}>
          <View style={styles.gradeItemContent}>
            <NativeText variant="default" numberOfLines={1}>
              {grade.description || "Note sans titre"}
            </NativeText>
            <NativeText variant="subtitle" numberOfLines={1}>
              {formattedDate}
            </NativeText>
          </View>
          <View style={styles.gradeValueContainer}>
            <NativeText style={styles.gradeValue}>
              {gradeValue}
            </NativeText>
            <NativeText style={styles.gradeOutOf}>
              /{grade.outOf.value?.toFixed(0) ?? "??"}
            </NativeText>
          </View>
        </View>
      </NativeItem>
    </Reanimated.View>
  );
});

const SubjectItem: React.FC<SubjectItemProps> = memo(({
  subject,
  index,
  allGrades,
  navigation,
}) => {
  const subjectData = useMemo(() =>
    getSubjectData(subject.average.subjectName),
  [subject.average.subjectName]
  );

  const renderGradeItem = useCallback(({ item, index }: { item: Grade; index: number }) => (
    <SubjectGradeItem
      subject={subject}
      grade={item}
      index={index}
      onPress={() => navigation.navigate("GradeDocument", { grade: item, allGrades })}
    />
  ), [subject, allGrades, navigation]);

  const keyExtractor = useCallback((item: Grade) => item.id, []);

  const animationDelay = useMemo(() =>
    ((index ?? 0) < 6) ? (100 * (index ?? 0)) : 0,
  [index]
  );

  return (
    <NativeList
      animated
      key={`averageItem${subject.average.subjectName}`}
      entering={animPapillon(FadeInUp).delay(animationDelay)}
      exiting={animPapillon(FadeOutDown).delay(animationDelay)}
    >
      <SubjectTitle
        navigation={navigation}
        subject={subject}
        subjectData={subjectData}
        allGrades={allGrades}
      />

      <FlatList
        data={subject.grades}
        renderItem={renderGradeItem}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={5}
      />
    </NativeList>
  );
});

const styles = {
  gradeItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  gradeItemContent: {
    flex: 1,
  },
  gradeValueContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  gradeValue: {
    fontSize: 17,
    lineHeight: 20,
    fontFamily: "medium",
  },
  gradeOutOf: {
    fontSize: 15,
    lineHeight: 15,
    opacity: 0.6,
  },
};

export default memo(SubjectItem);