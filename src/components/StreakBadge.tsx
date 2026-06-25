import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) {
    return null;
  }

  return (
    <View style={styles.badgeContainer}>
      <Ionicons name="flame" size={16} color="#FF9F0A" />
      <Text style={styles.streakText}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  streakText: {
    color: '#FF9F0A',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
});