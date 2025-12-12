/**
 * Encryption Service
 *
 * Service de chiffrement/déchiffrement AES-256 pour les mots de passe IMAP/SMTP
 */

const CryptoJS = require('crypto-js');

// Clé secrète pour le chiffrement (depuis .env)
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'default-encryption-key-change-in-production';

/**
 * Chiffrer une chaîne de caractères
 * @param {string} text - Texte à chiffrer
 * @returns {string} Texte chiffré
 */
exports.encrypt = (text) => {
  try {
    if (!text) return null;
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('❌ Erreur de chiffrement:', error);
    throw new Error('Échec du chiffrement');
  }
};

/**
 * Déchiffrer une chaîne de caractères
 * @param {string} encryptedText - Texte chiffré
 * @returns {string} Texte déchiffré
 */
exports.decrypt = (encryptedText) => {
  try {
    if (!encryptedText) return null;
    const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('Déchiffrement invalide - clé incorrecte?');
    }

    return decrypted;
  } catch (error) {
    console.error('❌ Erreur de déchiffrement:', error);
    throw new Error('Échec du déchiffrement');
  }
};
