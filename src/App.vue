<script setup>
// CP1: import { ref, reactive } from 'vue' and create your state here.
import TodoFilters from './components/TodoFilters.vue'
import TodoItem from './components/TodoItem.vue'

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
         writeBatch, serverTimestamp } from 'firebase/firestore'
import { db, todosCol, auth } from './firebase'
import LoginForm from './components/LoginForm.vue'
const title = ref('My Todo List')

/*const DEFAULT_TODOS = [
  { id: 1, text: 'Learn ref()', note: '',important: false, done: false },
  { id: 2, text: 'Install Node.js', note: 'Use LTS version', important: false, done: true },
  { id: 3, text: 'Build To-do App', note: '', important: true, done: false }
]
*/

//Start EMPTY. The data arrives in onMounted, just like data from a server will.
const todos = ref([])
const inputEl = ref(null)
const user = ref(null)          // the real Firebase user, or null
const authReady = ref(false)    // false until Firebase knows whether you're signed

let stopAuth = null
let stopTodos = null
let stopListening = null
// don't forget!!!

onMounted(() => {
  stopAuth = onAuthStateChanged(auth, (u) => {
    user.value = u
    authReady.value = true
  })
})

// Each time the user changes, stop the old listener and start one for the new user
watch(user, (u) => {
  if (stopTodos) stopTodos()
  todos.value = []
  if (!u) return

  const q = query(todosCol, where('uid', '==', u.uid), orderBy('createdAt'))
  stopTodos = onSnapshot(
    q,
    (snap) => { todos.value = snap.docs.map((d) => ({ id: d.id, ...d.data() })) },
    (err) => console.error('Could not load todos:', err.message),
  )
})

onUnmounted(() => {
  if (stopAuth) stopAuth()
  if (stopTodos) stopTodos()
})

function logout() {
  signOut(auth)   // the watch above clears the list and stops the listener
}

			onUnmounted(() => stopListening?.())

const showTips = ref(false)

/*newText → a string variable that holds todo tasks
newNote → a string variable that holds notes for each task
newImportant → boolean variable that toggle importance of task (check box)*/

const newText = ref('')
const newNote = ref('')
const newImportant = ref(false)

// filter → which tasks to show: 'all', 'active' or 'done'
const filter = ref('all')

// ---- computed: values DERIVED from other state. Cached, auto-updated. ----
const remaining = computed(() => todos.value.filter((t) => !t.done).length)
const doneCount = computed(() => todos.value.filter((t) => t.done).length)
const canAdd = computed(() => newText.value.trim().length > 0)

const visibleTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((t) => !t.done)
  if (filter.value === 'done') return todos.value.filter((t) => t.done)
  return todos.value
})

function addTodo() {
  if (newText.value.trim() === '') return

  const newTodo = {
  text: newText.value.trim(),
  note: newNote.value.trim(),
  important: newImportant.value,
  done: false,
  uid: user.value.uid,          // NEW: whose todo this is
  createdAt: serverTimestamp(),
}

  newText.value = ''
  newNote.value = ''
  newImportant.value = false

  addDoc(todosCol, newTodo)
}

function toggleTodo(id) {
  const todo = todos.value.find((t) => t.id === id)
  updateDoc(doc(db, 'todos', id), { done: !todo.done })
}

function removeTodo(id) {
  deleteDoc(doc(db, 'todos', id))
}

function clearDone() {
  const batch = writeBatch(db)
  todos.value
    .filter((t) => t.done)
    .forEach((t) => batch.delete(doc(db, 'todos', t.id)))
  batch.commit()
}

</script>

<template>
  <div class="app">
    <div class="card">
      <h1>{{ title }}</h1>

      <!-- 1. Firebase is still checking: avoids flashing the login form on refresh -->
      <p v-if="!authReady" class="empty">Loading…</p>

      <!-- 2. Signed out -->
      <LoginForm v-else-if="!user" />

      <!-- 3. Signed in: everything from CP8 -->
      <template v-else>
        <p class="sub">
          Hello, {{ user.email }}! {{ remaining }} of {{ todos.length }} tasks left.
          <button class="link" @click="logout">Sign out</button>
        </p>

        <div class="toolbar">
          <button class="link" @click="showTips = !showTips">
            {{ showTips ? 'Hide' : 'Show' }} tips
          </button>
        </div>
        <div v-show="showTips" class="tips">
          Tip: use the filter buttons to show only active or done tasks.
        </div>

        <form @submit.prevent="addTodo">
          <div class="row">
            <input ref="inputEl" v-model="newText" type="text" placeholder="What needs doing?" autofocus />
            <button class="primary" type="submit" :disabled="!canAdd">Add</button>
          </div>
          <textarea v-model="newNote" rows="2" placeholder="Notes (optional)"></textarea>
          <label class="check">
            <input v-model="newImportant" type="checkbox" /> Important
          </label>
        </form>

        <!-- Loop over the COMPUTED list, not the raw one -->
        <ul v-if="visibleTodos.length > 0" class="list">
          <!-- :todo passes data DOWN; @toggle / @remove listen for events coming UP -->
          <TodoItem
            v-for="todo in visibleTodos"
            :key="todo.id"
            :todo="todo"
            @toggle="toggleTodo"
            @remove="removeTodo"
          />
        </ul>
        <p v-else class="empty">Nothing here for "{{ filter }}".</p>

        <TodoFilters
          :filter="filter"
          :remaining="remaining"
          :done-count="doneCount"
          @change-filter="filter = $event"
          @clear-done="clearDone"
        />
      </template>
    </div>
  </div>
</template>

