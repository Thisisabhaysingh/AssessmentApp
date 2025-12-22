import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { User } from '../config/db.js';

const reset = async () => {
  const newPassword = 'Admin@123'; // choose any
  const hash = await bcrypt.hash(newPassword, 10);

  await User.update(
    { password: hash },
    { where: {} } // resets ALL users
  );

  console.log('Passwords reset successfully');
  process.exit();
};

reset();
