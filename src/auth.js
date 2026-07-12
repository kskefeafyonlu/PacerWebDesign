import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export let supabase = null

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
  }
} else {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or using placeholder values. Auth features will run in Mock Mode. Set up your .env.local file to connect your real database!'
  )
}

/**
 * Checks if Supabase client is initialized
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return supabase !== null
}

/**
 * Sign up a new user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function signUp(email, password) {
  if (!isSupabaseConfigured()) {
    // Mock signup for demo
    console.log('Mock Sign Up:', email)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Save to mock storage
        localStorage.setItem('mock_user', JSON.stringify({ email }))
        resolve({ data: { user: { email } }, error: null })
      }, 1000)
    })
  }

  return await supabase.auth.signUp({
    email,
    password,
  })
}

/**
 * Log in an existing user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured()) {
    // Mock signin for demo
    console.log('Mock Sign In:', email)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (password.length >= 6) {
          localStorage.setItem('mock_user', JSON.stringify({ email }))
          resolve({ data: { user: { email } }, error: null })
        } else {
          resolve({ data: null, error: { message: 'Invalid password. (Mock mode requires at least 6 characters)' } })
        }
      }, 1000)
    })
  }

  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

/**
 * Log out current user
 * @returns {Promise<{error: any}>}
 */
export async function signOut() {
  if (!isSupabaseConfigured()) {
    console.log('Mock Sign Out')
    localStorage.removeItem('mock_user')
    return { error: null }
  }

  return await supabase.auth.signOut()
}

/**
 * Listen for authentication changes
 * @param {function} callback 
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) {
    // Set up mock auth observer
    const checkMockUser = () => {
      const userJson = localStorage.getItem('mock_user')
      const user = userJson ? JSON.parse(userJson) : null
      callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user)
    }

    // Call immediately
    checkMockUser()

    // Listen to local storage changes (mock cross-tab logout/login)
    window.addEventListener('storage', (e) => {
      if (e.key === 'mock_user') {
        checkMockUser()
      }
    })

    // Expose a custom dispatcher for immediate local state changes
    window.addEventListener('mock-auth-changed', () => {
      checkMockUser()
    })

    return {
      data: {
        subscription: {
          unsubscribe() {
            // No-op for mock
          }
        }
      }
    }
  }

  // Real Supabase auth listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session ? session.user : null)
  })

  return {
    data: {
      subscription
    }
  }
}

/**
 * Get the current user
 * @returns {Promise<any>}
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    const userJson = localStorage.getItem('mock_user')
    return userJson ? JSON.parse(userJson) : null
  }

  const { data: { user } } = await supabase.auth.getUser()
  return user
}
