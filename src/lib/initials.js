export function getInitials(name) {
  return name
    .split(' ')
    .filter(w => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}
