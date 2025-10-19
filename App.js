import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SUPABASE_URL = 'https://kzpbsektugmaialpoehs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGJzZWt0dWdtYWlhbHBvZWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTY1NTMsImV4cCI6MjA3NjI5MjU1M30.UZ6PhcO8zmmiaGfq3Pcs6rjWKEJQYgj16KEiwnvFOnI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ExpenseTracker() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        setUser(data.session.user);
      }
    } catch (err) {
      console.log('Error checking user:', err);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        Alert.alert('Success', 'Account created! Please log in.');
        setEmail('');
        setPassword('');
        setIsLogin(true);
      }
    } catch (err) {
      setError('Signup failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
        setError(loginError.message);
      } else {
        setUser(data.user);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setExpenses([]);
    } catch (err) {
      Alert.alert('Error', 'Logout failed: ' + err.message);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Fetch error:', error);
      } else {
        setExpenses(data || []);
      }
    } catch (err) {
      console.log('Fetch expenses error:', err);
    }
  };

  const addExpense = async () => {
    if (!expenseName || !expenseAmount) {
      Alert.alert('Error', 'Please fill all expense fields');
      return;
    }

    try {
      const { error } = await supabase.from('expenses').insert([
        {
          user_id: user.id,
          name: expenseName,
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Expense added!');
        setExpenseName('');
        setExpenseAmount('');
        setExpenseCategory('Food');
        setShowAddExpense(false);
        fetchExpenses();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add expense: ' + err.message);
    }
  };

  const deleteExpense = async (id) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        fetchExpenses();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete expense: ' + err.message);
    }
    setDeletingId(null);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2);
  };

  const getCategoryColor = (category) => {
    const colors = {
      Food: '#FF6B6B',
      Transport: '#4ECDC4',
      Shopping: '#FFE66D',
      Entertainment: '#95E1D3',
      Utilities: '#C7CEEA',
      Other: '#B19CD9'
    };
    return colors[category] || '#95E1D3';
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      Food: '🍽️',
      Transport: '🚗',
      Shopping: '🛍️',
      Entertainment: '🎬',
      Utilities: '💡',
      Other: '📌'
    };
    return emojis[category] || '📌';
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Other'];

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💰</Text>
          </View>
          <Text style={styles.title}>Expense Tracker</Text>
          <Text style={styles.subtitle}>Manage your finances smartly</Text>

          <Text style={styles.modeTitle}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={isLogin ? handleLogin : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? "Don't have account? Sign Up" : 'Back to Login'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back!</Text>
          <Text style={styles.headerEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Amount Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardContent}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={styles.totalAmount}>₹{getTotalExpenses()}</Text>
            <Text style={styles.totalSubtitle}>{expenses.length} transactions this month</Text>
          </View>
          <View style={styles.totalIcon}>
            <Text style={styles.totalIconText}>💸</Text>
          </View>
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity
          style={[styles.addButton, showAddExpense && styles.addButtonActive]}
          onPress={() => setShowAddExpense(!showAddExpense)}
        >
          <Text style={styles.addButtonText}>
            {showAddExpense ? '✕ Close' : '+ Add New Expense'}
          </Text>
        </TouchableOpacity>

        {/* Add Expense Form */}
        {showAddExpense && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Expense</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>What did you spend on?</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Coffee, Gas, Movie"
                placeholderTextColor="#999"
                value={expenseName}
                onChangeText={setExpenseName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0.00"
                placeholderTextColor="#999"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryTag,
                      expenseCategory === cat && styles.categoryTagActive,
                    ]}
                    onPress={() => setExpenseCategory(cat)}
                  >
                    <Text style={styles.categoryEmoji}>{getCategoryEmoji(cat)}</Text>
                    <Text
                      style={[
                        styles.categoryTagText,
                        expenseCategory === cat && styles.categoryTagTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitFormButton} onPress={addExpense}>
              <Text style={styles.submitFormButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expenses List */}
        <View style={styles.expensesSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📊</Text>
              <Text style={styles.emptyStateText}>No expenses yet</Text>
              <Text style={styles.emptyStateSubtext}>Start tracking your expenses</Text>
            </View>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.expenseCard}>
                  <View style={[styles.expenseCategoryIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                    <Text style={styles.expenseCategoryEmoji}>{getCategoryEmoji(item.category)}</Text>
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseName}>{item.name}</Text>
                    <View style={styles.expenseFooter}>
                      <Text style={styles.expenseCategory}>{item.category}</Text>
                      <Text style={styles.expenseDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
                    <TouchableOpacity 
                      style={[styles.deleteButton, deletingId === item.id && styles.deleteButtonLoading]}
                      onPress={() => deleteExpense(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={styles.deleteButtonText}>×</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
  },
  authContent: {
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
    textAlign: 'center',
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orText: {
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  switchButton: {
    borderWidth: 2,
    borderColor: 'white',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  switchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#FCA5A5',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(220,38,38,0.15)',
    padding: 12,
    borderRadius: 8,
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerGreeting: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  headerEmail: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  content: {
    padding: 16,
  },
  totalCard: {
    backgroundColor: '#667EEA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  totalCardContent: {
    flex: 1,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginVertical: 6,
  },
  totalSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  totalIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalIconText: {
    fontSize: 32,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonActive: {
    backgroundColor: '#059669',
  },
  addButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryTagActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTagTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  submitFormButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitFormButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  expensesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseCategoryEmoji: {
    fontSize: 24,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 8,
  },
  expenseDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonLoading: {
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});