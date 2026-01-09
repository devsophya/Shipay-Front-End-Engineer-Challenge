import React from 'react';

class UserManagement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
      ],
      newUserName: '',
      newUserEmail: '',
      error: ''
    };

    // Bind dos métodos no constructor
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.addUser = this.addUser.bind(this);
  }

  // CORRIGIDO: Usa setState ao invés de mutação direta
  handleNameChange(event) {
    this.setState({ 
      newUserName: event.target.value,
      error: ''
    });
  }

  // CORRIGIDO: Usa setState (estava correto)
  handleEmailChange(event) {
    this.setState({ 
      newUserEmail: event.target.value,
      error: '' 
    });
  }

  // CORRIGIDO: Usa setState, valida, limpa campos, gera ID correto
  addUser() {
    const { newUserName, newUserEmail, users } = this.state;

    // Validação: Campos vazios
    if (!newUserName.trim() || !newUserEmail.trim()) {
      this.setState({ error: 'Por favor, preencha todos os campos' });
      return;
    }

    // Validação: Email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      this.setState({ error: 'Email inválido' });
      return;
    }

    // Validação: Email duplicado
    if (users.some(user => user.email.toLowerCase() === newUserEmail.toLowerCase())) {
      this.setState({ error: 'Este email já está cadastrado' });
      return;
    }

    // CORRIGIDO: Gera ID único usando timestamp
    const newUser = {
      id: Date.now(), 
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase()
    };

    // CORRIGIDO: Atualiza estado imutavelmente (sem push)
    // CORRIGIDO: Limpa campos após adicionar
    // CORRIGIDO: Remove forceUpdate
    this.setState({
      users: [...users, newUser],
      newUserName: '',
      newUserEmail: '',
      error: ''
    });
  }

  render() {
    const { users, newUserName, newUserEmail, error } = this.state;

    return (
      <div className="user-management">
        <h2>Gerenciamento de Usuários</h2>
        
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div className="form-container">
          {/* CORRIGIDO: Adiciona onChange */}
          <input
            type="text"
            placeholder="Nome do usuário"
            value={newUserName}
            onChange={this.handleNameChange} 
          />
          
          {/* CORRIGIDO: Usa método com bind (sem arrow function inline) */}
          <input
            type="email"
            placeholder="Email do usuário"
            value={newUserEmail}
            onChange={this.handleEmailChange} 
          />
          
          {/* CORRIGIDO: Usa método com bind (sem arrow function inline) */}
          <button onClick={this.addUser}>
            Adicionar Usuário
          </button>
        </div>

        <ul className="user-list">
          {/* CORRIGIDO: Adiciona key única */}
          {users.map(user => (
            <li key={user.id}> 
              {user.name} ({user.email})
            </li>
          ))}
        </ul>

        <div className="user-count">
          Total de usuários: {users.length}
        </div>
      </div>
    );
  }
}

export default UserManagement;
