import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';

const app = express();
const porta = 4000;
const host = '0.0.0.0';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'sua-chave-secreta', resave: true, saveUninitialized: true }))

const users = [];
const messages = [];
let lastLoginTime;

const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

app.get('/', (req, res) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Bem-vindo à Sala de Bate-Papo</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f0f0f0;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
              }
  
              h1 {
                  color: #333;
                  text-align: center;
              }
  
              a {
                  color: #007bff;
                  text-decoration: none;
                  font-weight: bold;
              }
          </style>
      </head>
      <body>
          <h1>Bem-vindo à sala de bate-papo. Faça <a href="/login">login</a> para continuar.</h1>
      </body>
      </html>
    `;  
    res.send(htmlContent);
  });

app.get('/login', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'login.html'));
  });

app.post('/login', (req, res) => {
  const nome = req.body.username;
  const senha = req.body.password;
  if (nome === 'Sarah' && senha === 'sarah123') {
    req.session.user = nome;
    const data = new Date();
    const dataHoraAtual = new Date().toLocaleString();

    lastLoginTime = data;
    res.redirect('/menu');
  } else {
    res.send('Credenciais inválidas. <a href="/login">Tente novamente</a>.');
  }
});

app.get('/menu', requireLogin, (req, res) => {
    const lastLogin = lastLoginTime ? lastLoginTime.toLocaleString() : 'N/A';
    res.sendFile(path.join(process.cwd(), 'menu.html'), { lastLogin });
});

app.get('/cadastro.html', requireLogin, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'cadastro.html'));
});

app.post('/cadastro.html', (req, res) => {
    const { nome, dataNascimento, nickname } = req.body;
    if (!nome || !dataNascimento || !nickname) {
        return res.send('Por favor, preencha todos os campos. <a href="/cadastro.html">Tente novamente</a>.');
    }
    const nicknameExistente = users.find(user => user.nickname === nickname);
    if (nicknameExistente) {
        return res.send('Este nickname já está em uso. <a href="/cadastro.html">Tente outro</a>.');
    }
    const novoUsuario = {
        nome: nome,
        dataNascimento: dataNascimento,
        nickname: nickname
    };
    users.push(novoUsuario);
    let tabelaResposta = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Cadastro de Usuário</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                table, th, td {
                    border: 1px solid #ddd;
                }

                th, td {
                    padding: 12px;
                    text-align: left;
                }

                th {
                    background-color: #f2f2f2;
                }

                tr:hover {
                    background-color: #f5f5f5;
                }
            </style>
        </head>
        <body>
            <h2>Usuário cadastrado com sucesso!</h2>
            <table>
                <tr>
                    <th>Nome</th>
                    <th>Data de Nascimento</th>
                    <th>Nickname</th>
                </tr>`;
    for (const user of users) {
        tabelaResposta += `
            <tr>
                <td>${user.nome}</td>
                <td>${user.dataNascimento}</td>
                <td>${user.nickname}</td>
            </tr>`;
    }
    tabelaResposta += `
            </table>
            <br>
            <a href="/menu">Voltar para o Menu</a>
        </body>
        </html>
     `;
    res.header('Content-Type', 'text/html');
    res.send(tabelaResposta);
});

app.get('/get-usuarios', (req, res) => {
    res.json({ usuarios: users });
});

app.get('/bate-papo.html', requireLogin, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'bate-papo.html'));
});

app.post('/postar-mensagem', requireLogin, (req, res) => {
    const { usuario, mensagem } = req.body;
    console.log('Recebendo requisição para postar mensagem:', { usuario, mensagem });

    if (!usuario || !mensagem) {
        return res.redirect('/bate-papo.html');
    }

    const usuarioExistente = users.find(user => user.nickname === usuario);
    if (!usuarioExistente) {
        return res.send('Usuário não encontrado. <a href="/bate-papo.html">Tente novamente</a>');
    }

    const dataHoraAtual = new Date().toLocaleString();
    const novaMensagem = {
        usuario: usuario,
        mensagem: mensagem,
        dataHora: dataHoraAtual,
    };

    messages.push(novaMensagem);

    res.redirect('/bate-papo.html');
});

app.get('/get-messages', requireLogin, (req, res) => {
    res.json({ messages: messages });
});

app.listen(porta, host, () => {
    console.log(`Servidor executando na url http://${host}:${porta}`);
  });