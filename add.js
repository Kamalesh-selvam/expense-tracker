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
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Expense deleted!');
        fetchExpenses();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete expense: ' + err.message);
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2);
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Other'];

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <Text style={styles.title}>💰 Expense Tracker</Text>
          <Text style={styles.subtitle}>Manage your finances</Text>

          <Text style={styles.modeTitle}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={isLogin ? handleLogin : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
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
              {isLogin ? 'Create New Account' : 'Back to Login'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Expense Tracker</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.userText}>Logged in as: {user.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Total Expenses</Text>
          <Text style={styles.totalAmount}>₹{getTotalExpenses()}</Text>
          <Text style={styles.transactionCount}>{expenses.length} transactions</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddExpense(!showAddExpense)}
        >
          <Text style={styles.addButtonText}>{showAddExpense ? '✕ Cancel' : '+ Add Expense'}</Text>
        </TouchableOpacity>

        {showAddExpense && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add New Expense</Text>
            <TextInput
              style={styles.input}
              placeholder="Expense name"
              placeholderTextColor="#999"
              value={expenseName}
              onChangeText={setExpenseName}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#999"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    expenseCategory === cat && styles.categoryBtnActive,
                  ]}
                  onPress={() => setExpenseCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryBtnText,
                      expenseCategory === cat && styles.categoryBtnTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.addButton} onPress={addExpense}>
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Expenses</Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses yet</Text>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.expenseItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseName}>{item.name}</Text>
                    <Text style={styles.expenseDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => deleteExpense(item.id)}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#F3F4F6',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
  },
  authContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 40,
    textAlign: 'center',
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  orText: {
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  switchButton: {
    borderWidth: 2,
    borderColor: 'white',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#FCA5A5',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(220,38,38,0.2)',
    padding: 10,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 5,
  },
  transactionCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  userText: {
    fontSize: 16,
    color: '#4B5563',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  categoryBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryBtnText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryBtnTextActive: {
    color: 'white',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  deleteBtn: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
});