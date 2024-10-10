import React, { useEffect, useMemo } from "react";
import { ScrollView, Text, View, Dimensions, StyleSheet, TouchableHighlight } from "react-native";
import { getSubjectData } from "@/services/shared/Subject";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ColorIndicator from "@/components/Lessons/ColorIndicator";
import { PapillonNavigation } from "@/router/refs";
import { NativeText } from "@/components/Global/NativeComponents";

const HOUR_HEIGHT = 100;
const START_HOUR = 0;
const END_HOUR = 23;
const DEFAULT_SCROLL_HOUR = 7;

const lz = (num) => (num < 10 ? `0${num}` : num);

const HourMarker = React.memo(({ hour, colors, top }) => (
  <View style={[styles.hourMarkerContainer, { top }]}>
    <View style={styles.hourLabelContainer}>
      <Text style={[styles.hourLabel, { color: colors.text }]}>
        {lz(hour)}:00
      </Text>
    </View>
    <View style={[styles.hourLine, { backgroundColor: colors.text }]} />
  </View>
));

const CourseItem = React.memo(({ course, colors, start, duration }) => {
  const subjectData = useMemo(() => getSubjectData(course.title), [course.title]);

  return (
    <View
      style={[styles.courseItemContainer, { backgroundColor: colors.background, top: start, height: duration,
        borderColor: colors.text + "55",
        borderWidth: 0.5,

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,

        overflow: "visible",

        maxWidth: 500,
        zIndex: course.startTimestamp,
      }]}
    >
      <TouchableHighlight
        onPress={() => {
          PapillonNavigation.current.navigate("LessonDocument", { lesson: course });
        }}
        style={{ flex: 1, borderRadius: 8, overflow: "hidden" }}
        underlayColor={subjectData.color + "32"}
      >

        <View
          style={
            [
              styles.courseItem,
              {
                backgroundColor: subjectData.color + "33",
                flexDirection: "row",
              }
            ]
          }
        >
          <View style={styles.colorIndicator}>
            <ColorIndicator
              color={subjectData.color}
              width={6}
            />
          </View>
          <View
            style={[styles.courseContent]}
          >
            <NativeText style={[styles.courseTime]}>
              {new Date(course.startTimestamp).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})} - {new Date(course.endTimestamp).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}
            </NativeText>

            <NativeText style={[styles.courseTitle]} variant="title">
              {course.title}
            </NativeText>

            {course.statusText && (
              <NativeText style={[styles.courseStatus]}>
                {course.statusText}
              </NativeText>
            )}

            {(duration > 90) && !(duration < 100 && course.statusText) &&
              <NativeText style={[styles.courseText]}>
                {course.teacher}
              </NativeText>
            }

            <NativeText style={[styles.courseText]}>
              {course.room}
            </NativeText>
          </View>
        </View>
      </TouchableHighlight>
    </View>
  );
});

const RelativePage = ({ day, onLayout }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { height: windowHeight } = Dimensions.get("window");

  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i), []);

  const getPosition = (timestamp) => {
    const date = new Date(timestamp);
    return (date.getHours() - START_HOUR + date.getMinutes() / 60) * HOUR_HEIGHT;
  };

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  const scrollViewRef = React.useRef(null);

  return (
    <ScrollView
      ref={scrollViewRef}
      onLayout={() => {
        onLayout();
        if (scrollViewRef.current) {
          const yOffset = (DEFAULT_SCROLL_HOUR - START_HOUR) * HOUR_HEIGHT;
          scrollViewRef.current.scrollTo({ y: yOffset, animated: false });
        }
      }}
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollViewContent,
        {
          paddingTop: insets.top + 64,
          minHeight: windowHeight,
        }
      ]}
      scrollIndicatorInsets={{ top: insets.top }}
    >
      <View style={[styles.container, { height: totalHeight }]}>
        {hours.map((hour, index) => (
          <HourMarker
            key={hour}
            hour={hour}
            colors={colors}
            top={index * HOUR_HEIGHT}
          />
        ))}

        {day.map((course, index) => {
          const start = getPosition(course.startTimestamp);
          const end = getPosition(course.endTimestamp);
          const duration = end - start;

          return (
            <CourseItem
              key={index}
              course={course}
              colors={colors}
              start={start}
              duration={duration}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    height: "100%",
    width: "100%",
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  container: {
    position: "relative",
  },
  hourMarkerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
  },
  hourLabelContainer: {
    position: "absolute",
    top: -10,
    left: 10,
    width: 50,
    paddingRight: 5,
  },
  hourLabel: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: "medium",
    opacity: 0.5,
    textAlign: "right",
    marginTop: 3.5,
  },
  hourLine: {
    position: "absolute",
    top: 0,
    left: 70,
    right: 10,
    height: 1,
    opacity: 0.2,
  },
  courseItemContainer: {
    position: "absolute",
    left: 70,
    right: 10,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  courseItem: {
    padding: 0,
    flex: 1,
    overflow: "hidden",
    borderRadius: 8,
  },
  courseContent: {
    padding: 10,
    flex: 1,
    gap: 5,
  },
  courseTime: {
    fontSize: 12.5,
    lineHeight: 13,
    fontFamily: "semibold",
    letterSpacing: 0.2,
    opacity: 0.5,
  },
  courseTitle: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: "bold",
  },
  courseText: {
    fontSize: 13.5,
    lineHeight: 13.5,
    opacity: 0.5,
  },
  courseStatus: {
    fontSize: 13.5,
    lineHeight: 13.5,
    opacity: 1,
    fontFamily: "semibold",
  },
});

export default RelativePage;