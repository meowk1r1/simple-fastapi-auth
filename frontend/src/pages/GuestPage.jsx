import { Link } from 'react-router-dom'

export default function GuestPage() {
  return (
    <div>
      <h1>Дела в порядке</h1>
      <p>Веб-приложение для удобного ведения списка дел. Сервис помогает пользователям не забывать о предстоящих важных событиях и задачах.</p>
      <Link to="/register">
        <button>Зарегистрироваться</button>
      </Link>
    </div>
  )
}