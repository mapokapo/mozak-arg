/**
 * Answers to the ARG tasks. Array element index corresponds to the task index.
 *
 * Some tasks have multiple correct answers, in which case the answer is an array of strings.
 *
 * Tasks:
 * 1. Find hidden base64 string in HTML source code a website, decode it, read out the pixel values drawn inside the image, decode the binary data into ASCII text.
 * 2. Download an audio file, extract the Morse code signals from the audio, decode the Morse code into ASCII text.
 * 3. Transcribe DNA sequence into mRNA, then translate the mRNA sequence into a protein sequence using a lookup table.
 * 4. Solve a riddle to find the Vigenere cipher key, use the key to decrypt the ciphertext on the website, use the location name in the plaintext to find the Google Maps plus code for it, which is the answer.
 * 5. Recognize the pattern drawn on an HTML canvas, reverse engineer the JS code which draws the pattern, find the unused function in the code, input the name of the drawn pattern into the function, and the output is the answer.
 * 6. Play a numbers game with a bot inside of a web terminal emulator, upon winning the game the bot will reveal the answer.
 */
export const answers = [
  "SWITCH25",
  ["AUDITORYCORTEX", "AUDITORY CORTEX"],
  "START",
  ["8RXJ+XC", "8RXJ+W7P", "8RXH+WXP"],
  "2025",
];
