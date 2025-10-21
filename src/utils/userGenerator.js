// Utilidades para generar datos automáticos de usuarios

// Función para generar email automático basado en el nombre
export const generateEmailFromName = (fullName) => {
  if (!fullName) return '';
  
  // Limpiar y normalizar el nombre
  const cleanName = fullName
    .toLowerCase()
    .normalize('NFD') // Normalizar caracteres especiales
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z\s]/g, '') // Solo letras y espacios
    .trim();
  
  // Dividir el nombre en partes
  const nameParts = cleanName.split(/\s+/);
  
  let emailPrefix = '';
  
  if (nameParts.length >= 2) {
    // Si tiene nombre y apellido, usar primera letra del nombre + apellido
    emailPrefix = nameParts[0].charAt(0) + nameParts[nameParts.length - 1];
  } else if (nameParts.length === 1) {
    // Si solo tiene un nombre, usar el nombre completo
    emailPrefix = nameParts[0];
  }
  
  // Agregar números aleatorios para evitar duplicados
  const randomNum = Math.floor(Math.random() * 999) + 1;
  emailPrefix += randomNum.toString().padStart(2, '0');
  
  return `${emailPrefix}@calzado.com`;
};

// Función para generar contraseña automática
export const generateSecurePassword = (length = 6) => {
  // Asegurar que la longitud esté entre 5 y 8
  const finalLength = Math.max(5, Math.min(8, length));
  
  const upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const allChars = upperCaseLetters + numbers;
  
  let password = '';
  
  // Garantizar al menos 2 letras mayúsculas y 2 números
  password += upperCaseLetters[Math.floor(Math.random() * upperCaseLetters.length)];
  password += upperCaseLetters[Math.floor(Math.random() * upperCaseLetters.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Completar el resto de la contraseña
  for (let i = password.length; i < finalLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres para que no siempre estén en el mismo orden
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Función para validar email único
export const checkEmailUnique = async (email, existingUsers = []) => {
  // Verificar contra usuarios existentes
  const emailExists = existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
  return !emailExists;
};

// Función para generar datos completos del usuario
export const generateUserData = async (name, existingUsers = []) => {
  let email = generateEmailFromName(name);
  let attempts = 0;
  
  // Intentar hasta 10 veces generar un email único
  while (attempts < 10) {
    const isUnique = await checkEmailUnique(email, existingUsers);
    if (isUnique) break;
    
    // Si no es único, agregar más números
    const baseName = email.split('@')[0].replace(/\d+$/, '');
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    email = `${baseName}${randomNum}@calzado.com`;
    attempts++;
  }
  
  const password = generateSecurePassword();
  
  return {
    email,
    password,
    isGenerated: true
  };
};