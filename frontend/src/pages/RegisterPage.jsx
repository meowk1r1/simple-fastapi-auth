import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.username.trim()) newErrors.username = 'Обязательное поле'
    if (!form.email.trim()) newErrors.email = 'Обязательное поле'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) newErrors.email = 'Неверный формат email'
    if (!form.password) newErrors.password = 'Обязательное поле'
    else if (form.password.length < 8) newErrors.password = 'Минимум 8 символов'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    try {
      await register(form.username, form.email, form.password)
      navigate('/main')
    } catch (err) {
      setSubmitError('Ошибка регистрации. Возможно, email или имя уже заняты.')
    }
  }

  return (
    <div>
      <h2>Регистрация аккаунта</h2>
      <form onSubmit={handleSubmit}>
        {submitError && <p style={{color: 'red'}}>Пожалуйста, исправьте ошибки в форме</p>}
        
        <div>
          <label>Имя:
            <input 
              type="text" 
              value={form.username}
              onChange={handleChange('username')}
              required
            />
          </label>
          {errors.username && <p style={{color: 'red'}}>{errors.username}</p>}
        </div>
        
        <div>
          <label>E-mail:
            <input 
              type="email" 
              value={form.email}
              onChange={handleChange('email')}
              required
            />
          </label>
          {errors.email && <p style={{color: 'red'}}>{errors.email}</p>}
        </div>
        
        <div>
          <label>Пароль:
            <input 
              type="password" 
              value={form.password}
              onChange={handleChange('password')}
              required
            />
          </label>
          {errors.password && <p style={{color: 'red'}}>{errors.password}</p>}
        </div>
        
        <button type="submit">Зарегистрироваться</button>
      </form>
      <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </div>
  )
}