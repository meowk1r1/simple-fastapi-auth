import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function MainPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [view, setView] = useState('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Формы
  const [newProjectName, setNewProjectName] = useState('')
  const [newTask, setNewTask] = useState({ title: '', project_id: '', due_date: '', file: null })
  const [formErrors, setFormErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')

  // Загрузка данных
  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [selectedProject, view, showCompleted])

  const loadProjects = async () => {
    try {
      const res = await api.get('/api/v1/projects/')
      setProjects(res.data)
    } catch (err) {
      console.error('Failed to load projects', err)
    }
  }

  const loadTasks = async () => {
    try {
      let url = `/api/v1/tasks/?view=${view}&show_completed=${showCompleted}`
      if (selectedProject) url += `&project_id=${selectedProject}`
      const res = await api.get(url)
      setTasks(res.data)
    } catch (err) {
      console.error('Failed to load tasks', err)
    }
  }

  // Добавление проекта
  const handleAddProject = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setSubmitMessage('')
    
    if (!newProjectName.trim()) {
      setFormErrors({ name: 'Название не может быть пустым' })
      return
    }
    
    try {
      await api.post('/api/v1/projects/', { name: newProjectName.trim() })
      setNewProjectName('')
      loadProjects()
    } catch (err) {
      setSubmitMessage('Ошибка: проект с таким названием уже существует')
    }
  }

  // Добавление задачи
  const handleAddTask = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setSubmitMessage('')
    
    const errors = {}
    if (!newTask.title.trim()) errors.title = 'Обязательное поле'
    if (!newTask.project_id) errors.project_id = 'Выберите проект'
    if (newTask.due_date && newTask.due_date < new Date().toISOString().split('T')[0]) {
      errors.due_date = 'Дата не может быть в прошлом'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      const formData = new FormData()
    //   formData.append('title', newTask.title.trim())
    //   formData.append('project_id', newTask.project_id)

       let addiction = `?title=${newTask.title.trim()}&project_id=${newTask.project_id}`


      if (newTask.due_date) addiction = addiction + `&due_date=${newTask.due_date}`
      if (newTask.file) formData.append('file', newTask.file)
      
      await api.post('/api/v1/tasks/'+ addiction, formData, { formData: true })
      setNewTask({ title: '', project_id: '', due_date: '', file: null })
      loadTasks()
    } catch (err) {
      setSubmitMessage('Ошибка при создании задачи')
    }
  }

  // Переключение статуса задачи
  const toggleTask = async (taskId) => {
    try {
      await api.patch(`/api/v1/tasks/${taskId}/toggle`, {})
      loadTasks()
    } catch (err) {
      console.error('Failed to toggle task', err)
    }
  }

  // Поиск
  const handleSearch = async (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    try {
      const res = await api.get(`/api/v1/tasks/search?q=${encodeURIComponent(q)}`)
      setTasks(res.data)
      setView('search')
    } catch (err) {
      console.error('Search failed', err)
    }
  }

  // Выход
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Фильтры
  const filterLinks = [
    { id: 'all', label: 'Все задачи' },
    { id: 'today', label: 'Повестка дня' },
    { id: 'tomorrow', label: 'Завтра' },
    { id: 'overdue', label: 'Просроченные' },
  ]

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Левая колонка: Проекты */}
      <div style={{ width: '25%' }}>
        <h3>Проекты</h3>
        <ul>
          <li>
            <button 
              onClick={() => setSelectedProject(null)}
              style={{ fontWeight: selectedProject === null ? 'bold' : 'normal' }}
            >
              Все проекты
            </button>
          </li>
          {projects.map(p => (
            <li key={p.id}>
              <button 
                onClick={() => setSelectedProject(p.id)}
                style={{ fontWeight: selectedProject === p.id ? 'bold' : 'normal' }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
        
        <form onSubmit={handleAddProject}>
          <input 
            type="text" 
            placeholder="Название проекта"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
          />
          <button type="submit">Добавить проект</button>
          {formErrors.name && <p style={{color: 'red'}}>{formErrors.name}</p>}
          {submitMessage && <p style={{color: 'red'}}>{submitMessage}</p>}
        </form>
        
        <div style={{ marginTop: '20px' }}>
          <p>Пользователь: {user?.username}</p>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      {/* Правая колонка: Задачи */}
      <div style={{ width: '75%' }}>
        {/* Поиск */}
        <form onSubmit={handleSearch} style={{ marginBottom: '10px' }}>
          <input 
            type="search" 
            placeholder="Поиск задачи..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit">Найти</button>
        </form>

        {/* Фильтры */}
        <div style={{ marginBottom: '10px' }}>
          {filterLinks.map(f => (
            <button 
              key={f.id}
              onClick={() => { setView(f.id); setSearchQuery('') }}
              style={{ marginRight: '5px', fontWeight: view === f.id ? 'bold' : 'normal' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Список задач */}
        <div>
          <h4>Задачи ({tasks.length})</h4>
          {tasks.length === 0 ? (
            <p>Нет задач в этом представлении</p>
          ) : (
            <ul>
              {tasks.map(task => (
                <li key={task.id} style={{ marginBottom: '5px' }}>
                  <input 
                    type="checkbox" 
                    checked={task.is_completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span 
                    onClick={() => toggleTask(task.id)}
                    style={{ 
                      textDecoration: task.is_completed ? 'line-through' : 'none',
                      cursor: 'pointer',
                      marginLeft: '5px'
                    }}
                  >
                    {task.title}
                  </span>
                  {task.file_path && (
                    <a href={task.file_path} download style={{ marginLeft: '10px' }}>📎</a>
                  )}
                  {task.due_date && (
                    <span style={{ marginLeft: '10px', color: '#666' }}>
                      Срок: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          {!showCompleted && (
            <button onClick={() => setShowCompleted(true)}>Показать выполненные</button>
          )}
        </div>

        {/* Форма добавления задачи */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <h4>Добавить задачу</h4>
          <form onSubmit={handleAddTask}>
            {submitMessage && <p style={{color: 'red'}}>Пожалуйста, исправьте ошибки в форме</p>}
            
            <div>
              <label>Название:
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </label>
              {formErrors.title && <p style={{color: 'red'}}>{formErrors.title}</p>}
            </div>
            
            <div>
              <label>Проект:
                <select 
                  value={newTask.project_id}
                  onChange={e => setNewTask(prev => ({ ...prev, project_id: e.target.value }))}
                  required
                >
                  <option value="">Выберите проект</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              {formErrors.project_id && <p style={{color: 'red'}}>{formErrors.project_id}</p>}
            </div>
            
            <div>
              <label>Срок выполнения:
                <input 
                  type="date" 
                  value={newTask.due_date}
                  onChange={e => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </label>
              {formErrors.due_date && <p style={{color: 'red'}}>{formErrors.due_date}</p>}
            </div>
            
            <div>
              <label>Файл:
                <input 
                  type="file" 
                  onChange={e => setNewTask(prev => ({ ...prev, file: e.target.files[0] }))}
                />
              </label>
            </div>
            
            <button type="submit">Добавить</button>
          </form>
        </div>
      </div>
    </div>
  )
}