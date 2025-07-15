import {QUICK_ACTIONS} from '@/constants/quickActions';
import {
  DosageHistory,
  getMedications,
  getTodaysDoses,
  Medication,
  recordDose,
} from '@/utils/storage';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {Link, useFocusEffect} from 'expo-router';
import {useState, useEffect, useCallback, useRef} from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

const {width} = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: number;
  totalDoses: number;
  completedDoses: number;
}

function CircularProgress({
  progress,
  totalDoses,
  completedDoses,
}: Readonly<CircularProgressProps>) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const size = width * 0.55;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const animatedStrokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        <Text style={styles.progressLabel}>
          {completedDoses} of {totalDoses} doses
        </Text>
      </View>
      <Svg
        width={size}
        height={size}
        style={styles.progressRing}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='rgba(255, 255, 255, 0.2)'
          strokeWidth={strokeWidth}
          fill='none'
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='white'
          strokeWidth={strokeWidth}
          fill='none'
          strokeDasharray={circumference}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap='round'
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todaysMedications, setTodaysMedications] = useState<Medication[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [completedDoses, setCompletedDoses] = useState(0);
  const [doseHistory, setDoseHistory] = useState<DosageHistory[]>([]);

  const loadMedications = useCallback(async () => {
    try {
      const [allMedications, todaysDoses] = await Promise.all([
        getMedications(),
        getTodaysDoses(),
      ]);
      setDoseHistory(todaysDoses);
      setMedications(allMedications);
      // Filter medications for today
      const today = new Date();
      const todayMeds = allMedications.filter((med) => {
        const startDate = new Date(med.startDate);
        const durationDays = parseInt(med.duration.split(' ')[0]);

        // For ongoing medications or if within duration
        if (
          durationDays === -1 ||
          (today >= startDate &&
            today <=
              new Date(
                startDate.getTime() + durationDays * 24 * 60 * 60 * 1000
              ))
        ) {
          return true;
        }
        return false;
      });

      setTodaysMedications(todayMeds);

      // Calculate completed doses
      const completed = todaysDoses.filter((dose) => dose.taken).length;
      setCompletedDoses(completed);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = () => {
        // Cleanup if needed
      };
      loadMedications();
      return () => unsubscribe();
    }, [loadMedications])
  );

  const progress =
    todaysMedications.length > 0
      ? (completedDoses / (todaysMedications.length * 2)) * 100
      : 0;

  const isDoseTaken = (medicationId: string) => {
    return doseHistory.some(
      (dose) => dose.medicationId === medicationId && dose.taken
    );
  };

  const handleTakeDose = async (medication: Medication) => {
    try {
      await recordDose(medication.id, true, new Date().toISOString());
      await loadMedications(); // Reload data after recording dose
    } catch (error) {
      console.error('Error recording dose:', error);
      Alert.alert('Error', 'Failed to record dose. Please try again.');
    }
  };

  const notficatioMedications = todaysMedications.filter((medication) =>
    doseHistory.find(
      (dose) => dose.medicationId === medication.id && !dose.taken
    )
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#1a8e2d', '#146922']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.flex1}>
              <Text style={styles.greeting}>Daily Progress</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons
                name='notifications-outline'
                size={24}
                color={'white'}
              />
              {notficatioMedications.length ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {notficatioMedications.length}
                  </Text>
                </View>
              ) : (
                ''
              )}
            </TouchableOpacity>
          </View>
          {/* Circular Progress */}
          <CircularProgress
            progress={progress}
            totalDoses={todaysMedications.length * 2}
            completedDoses={completedDoses}
          />
        </View>
      </LinearGradient>
      {/* Quick Actions */}
      <View style={styles.content}>
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Link
                href={action.route}
                key={action.label}
                asChild
              >
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionGradient}
                  >
                    <View style={styles.actionContent}>
                      <View style={styles.actionIcon}>
                        <Ionicons
                          name={action.icon}
                          size={28}
                          color='white'
                        />
                      </View>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text> Today's Schedule</Text>
          <Link
            href='/calendar'
            asChild
          >
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </Link>
        </View>
        {todaysMedications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name='medical-outline'
              size={48}
              color='#ccc'
            />
            <Text style={styles.emptyStateText}>
              No medications scheduled for today
            </Text>
            <Link
              href='/medications/add'
              asChild
            >
              <TouchableOpacity style={styles.addMedicationButton}>
                <Text style={styles.addMedicationButtonText}>
                  Add Medication
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <>
            {todaysMedications.map((medication) => {
              const isTaken = isDoseTaken(medication.id);
              return (
                <View
                  key={medication.id}
                  style={styles.doseCard}
                >
                  <View
                    style={[
                      styles.doseBadge,
                      {backgroundColor: `${medication.color}15`},
                    ]}
                  >
                    <Ionicons
                      name='medical'
                      size={24}
                      color={medication.color}
                    />
                  </View>
                  <View style={styles.doseInfo}>
                    <View>
                      <Text style={styles.medicineName}>{medication.name}</Text>
                      <Text style={styles.dosageInfo}>{medication.dosage}</Text>
                    </View>
                    <View style={styles.doseTime}>
                      <Ionicons
                        name='time-outline'
                        size={16}
                        color='#666'
                      />
                      <Text style={styles.timeText}>{medication.times[0]}</Text>
                    </View>
                  </View>
                  {isTaken ? (
                    <View style={[styles.takenBadge]}>
                      <Ionicons
                        name='checkmark-circle'
                        size={20}
                        color='#4CAF50'
                      />
                      <Text style={styles.takenText}>Taken</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.takeDoseButton,
                        {backgroundColor: medication.color},
                      ]}
                      onPress={() => handleTakeDose(medication)}
                    >
                      <Text style={styles.takeDoseText}>Take</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}
      </View>
      <Modal
        visible={showNotifications}
        animationType='slide'
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View
          style={styles.modalOverlay}
          onTouchStart={() => setShowNotifications(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name='close'
                  size={24}
                  color='#333'
                />
              </TouchableOpacity>
            </View>
            {notficatioMedications.map((medication) => (
              <View
                key={medication.id}
                style={styles.notificationItem}
              >
                <View style={styles.notificationIcon}>
                  <Ionicons
                    name='medical'
                    size={24}
                    color={medication.color}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {medication.name}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {medication.dosage}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {medication.times[0]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffe9',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  flex1: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginLeft: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5252',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#146922',
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  progressDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  progressRing: {
    transform: [{rotate: '-90deg'}],
  },
  actionButton: {
    width: (width - 52) / 2,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 15,
  },
  actionGradient: {
    flex: 1,
    padding: 15,
  },
  actionContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllButton: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  addMedicationButton: {
    backgroundColor: '#1a8e2d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addMedicationButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  takenText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  doseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  doseBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  doseInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dosageInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  doseTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  takeDoseButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginLeft: 10,
  },
  takeDoseText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
