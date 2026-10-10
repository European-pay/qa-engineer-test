import bcrypt from 'bcryptjs';

const hash = await bcrypt.hash('Test123!', 10);
console.log(hash);

console.log(
  await bcrypt.compare('Test123!', hash)
);