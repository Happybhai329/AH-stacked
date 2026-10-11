import fs from 'fs';

const html = fs.readFileSync('D:/prime/acedmic headd app/index.html', 'utf8');

// Find all elements with student in id, class, or onclick
const lines = html.split('\n');
console.log('Total HTML lines:', lines.length);

const found = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('STUDENTS MANAGE') || lines[i].includes('studentModal') || lines[i].includes('manageStudent') || lines[i].includes('openStudentsModal') || lines[i].includes('student-management') || lines[i].includes('studentApp')) {
    found.push({ line: i + 1, text: lines[i].trim().slice(0, 150) });
  }
}
console.log('Matches:', found);
