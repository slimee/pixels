export const predefinedTransformations = [
  {
    name: 'Déplacement',
    code: `x = x + 1;
    y = y + 1;`
  },
  {
    name: 'Vagues sinusoïdales',
    code: `x = x + Math.sin(y / 10);
    y = y + Math.cos(x / 10);`
  },
  {
    name: 'Tourbillon',
    code: `var centerX = width / 2;
    var centerY = height / 2;
    var angle = Math.PI / 180;
    var dx = x - centerX;
    var dy = y - centerY;
    x = centerX + dx * Math.cos(angle) - dy * Math.sin(angle);
    y = centerY + dx * Math.sin(angle) + dy * Math.cos(angle);`
  },
  {
    name: 'Jitter aléatoire',
    code: `x = x + (Math.random() - 0.5) * 10;
    y = y + (Math.random() - 0.5) * 10;`
  },
  {
    name: 'Effet miroir',
    code: `x = width - x;
    y = y;`
  },
  {
    name: 'Zoom progressif',
    code: `x = x * 1.01;
    y = y * 1.01;`
  },
  {
    name: 'Ondes circulaires',
    code: `var dx = x - width / 2;
    var dy = y - height / 2;
    var distance = Math.sqrt(dx * dx + dy * dy);
    x = x + Math.sin(distance / 10) * 5;
    y = y + Math.cos(distance / 10) * 5;`
  },
  {
    name: 'Rotation',
    code: `var angle = Math.PI / 180;
    var newX = Math.cos(angle) * x - Math.sin(angle) * y;
    var newY = Math.sin(angle) * x + Math.cos(angle) * y;
    x = newX;
    y = newY;`
  },
  {
    name: 'Déformation en spirale',
    code: `var angle = Math.atan2(y - height / 2, x - width / 2);
    var radius = Math.hypot(x - width / 2, y - height / 2);
    angle += radius / 100;
    x = width / 2 + radius * Math.cos(angle);
    y = height / 2 + radius * Math.sin(angle);`
  },
  {
    name: 'Déplacement vertical',
    code: `x = x;
    y = y + Math.sin(x / 20) * 10;`
  },
  {
    name: 'Éclatement',
    code: `var centerX = width / 2;
    var centerY = height / 2;
    x = x + (x - centerX) * 0.01;
    y = y + (y - centerY) * 0.01;`
  },
  // Ajoutez ici les transformations supplémentaires si nécessaire
];
