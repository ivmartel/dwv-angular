/**
 * Material icon names of the annotation shapes,
 *   indexed by lower case shape name.
 */
const shapeIcons: Record<string, string> = {
  ruler: 'straighten',
  arrow: 'call_made',
  rectangle: 'crop_landscape',
  circle: 'radio_button_unchecked',
  ellipse: 'sports_rugby',
  protractor: 'square_foot',
  roi: 'polyline'
};

/**
 * Get the icon of a shape.
 *
 * @param shape The shape name (case insensitive).
 * @returns The associated material icon name, 'help_outline' if unknown.
 */
export function getShapeIcon(shape: string) {
  return shapeIcons[shape.toLowerCase()] ?? 'help_outline';
}
