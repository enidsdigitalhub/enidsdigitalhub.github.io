"""Quiz questions. Each option sets target values on some profile axes (0-1).
chips = three colours shown on the option card."""

def O(label, sub, chips, tags=(), **v): return dict(label=label, sub=sub, chips=chips, tags=list(tags), v=v)

QUESTIONS = [
 dict(q="It's Sunday evening. Where are you?", o=[
  O("A tidy, light room with tea and a book", "Calm and uncluttered", ["#F2EEE6", "#C8B194", "#7C8466"], color=.1, decor=.1, mood=.1, rustic=.3, tags=['japandi', 'minimalist', 'scandinavian']),
  O("By a crackling fire under a wool blanket", "Cosy and sheltered", ["#7A5236", "#9A5B32", "#2B2A28"], rustic=.9, mood=.7, warmth=.8, tags=['rustic', 'farmhouse']),
  O("Round a long table with friends and food", "Lively and warm", ["#6B7A45", "#B8643E", "#5B3A29"], warmth=.8, decor=.5, color=.5, tags=['farmhouse', 'mediterranean', 'transitional']),
  O("On a sunny terrace surrounded by plants", "Slow and outdoorsy", ["#F3EDE1", "#4C7A47", "#E3A23B"], green=.9, mood=.1, warmth=.7)], tags=['tropical', 'mediterranean', 'bohemian', 'coastal']),
 dict(q="Which walls would you live with for years?", o=[
  O("Crisp white or soft off-white", "Bright and clean", ["#F7F6F3", "#ECEAE5", "#D3D0C9"], color=0, mood=0, tags=['minimalist', 'scandinavian', 'coastal', 'contemporary']),
  O("Warm oat, greige or mushroom", "A quiet, warm neutral", ["#E9E0D2", "#CFC8BD", "#9E9284"], color=.2, warmth=.6, mood=.25, tags=['modern-organic', 'japandi', 'contemporary', 'transitional']),
  O("Limewash with a terracotta or blue wall", "Sunny and textured", ["#F5F0E6", "#B9603A", "#2F5F8A"], color=.55, warmth=.8, era=.5, tags=['mediterranean', 'bohemian']),
  O("Deep emerald, navy or cobalt", "Dramatic and enveloping", ["#1F4D43", "#23407A", "#2F3E55"], color=.9, mood=.85)], tags=['art-deco', 'eclectic-maximalist']),
 dict(q="Pick the sofa you'd sink into.", o=[
  O("Curved, cream bouclé", "Soft and sculptural", ["#F3EEE6", "#E9E0D2", "#D9C9B0"], decor=.25, rustic=.4, era=.2, color=.15, tags=['modern-organic', 'contemporary', 'japandi']),
  O("Worn cognac leather", "Built to last", ["#8E5733", "#7A5236", "#6B5643"], rustic=.85, mood=.65, era=.55, tags=['industrial', 'rustic', 'mid-century-modern']),
  O("Jewel-toned velvet", "Rich and glamorous", ["#1F4D43", "#B0305A", "#B8934A"], color=.9, era=.8, decor=.75, rustic=.1, tags=['art-deco', 'eclectic-maximalist']),
  O("Low linen with loose covers", "Relaxed and easy", ["#EDE3D6", "#DCCBAE", "#A9C6C1"], rustic=.4, color=.3, mood=.1, decor=.35)], tags=['coastal', 'farmhouse', 'scandinavian', 'mediterranean']),
 dict(q="Which wood or metal do you reach for?", o=[
  O("Pale oak or ash", "Light and natural", ["#D7C3A3", "#C8B194", "#F6F5F1"], rustic=.3, mood=.05, era=.2, tags=['scandinavian', 'japandi', 'minimalist', 'coastal']),
  O("Teak or walnut on tapered legs", "Warm and retro", ["#9A5E34", "#5A3B26", "#D3A232"], era=.75, warmth=.7, rustic=.3, tags=['mid-century-modern', 'contemporary']),
  O("Reclaimed timber and black steel", "Raw and honest", ["#7A5A3E", "#5D6063", "#2B2B2B"], rustic=.9, mood=.7, warmth=.4, tags=['industrial', 'rustic', 'farmhouse']),
  O("Lacquer, marble and polished brass", "Polished and luxe", ["#161616", "#C9C6C0", "#B8934A"], rustic=.05, era=.9, mood=.8)], tags=['art-deco', 'transitional']),
 dict(q="How do you feel about pattern?", o=[
  O("None, texture is enough", "Plain weaves, no prints", ["#E6DFD3", "#D3D0C9", "#A9A69F"], color=.1, decor=.1, tags=['minimalist', 'japandi', 'modern-organic', 'contemporary']),
  O("A few subtle ones", "Stripes, checks, a quiet rug", ["#F5F1EA", "#2F3E55", "#C9C0B2"], decor=.4, color=.35, era=.5, tags=['transitional', 'farmhouse', 'coastal', 'scandinavian']),
  O("One bold print I love", "Leafy, graphic or Moroccan", ["#2F5D3A", "#E07A5F", "#C9962E"], decor=.7, color=.75, green=.8, tags=['tropical', 'mid-century-modern', 'bohemian', 'mediterranean']),
  O("Pattern on pattern", "The more the merrier", ["#B0305A", "#2E8A86", "#E0A22F"], decor=1, color=1)], tags=['eclectic-maximalist', 'bohemian']),
 dict(q="How many plants?", o=[
  O("One or two, max", "Low-maintenance", ["#F7F6F3", "#8C9093", "#A8B59B"], green=.2, tags=['minimalist', 'contemporary', 'industrial', 'art-deco']),
  O("A few statement plants", "An olive tree, a fiddle leaf", ["#E9E0D2", "#6F7445", "#B98A5E"], green=.5, tags=['modern-organic', 'japandi', 'mediterranean', 'mid-century-modern']),
  O("Lots. Bring on the jungle", "Hanging, trailing, everywhere", ["#2F5D3A", "#7FA36B", "#C9A46C"], green=1, tags=['tropical', 'bohemian']),
  O("I prefer flowers and branches", "Cut stems in a vase", ["#F5F1EA", "#D8A7A0", "#A8998A"], green=.35, era=.5)], tags=['transitional', 'farmhouse', 'coastal', 'scandinavian']),
 dict(q="Your dream getaway?", o=[
  O("A quiet retreat in Kyoto or Copenhagen", "Simple, beautiful, calm", ["#F2EEE6", "#B08A62", "#4A4642"], color=.1, mood=.2, decor=.1, warmth=.45, tags=['japandi', 'scandinavian', 'minimalist']),
  O("A beach house with the doors open", "Sun, salt and breeze", ["#F4F2EC", "#A9C6C1", "#4F7184"], warmth=.3, mood=0, color=.4, green=.3, tags=['coastal', 'tropical']),
  O("A Greek island or Spanish village", "Whitewash and blue doors", ["#F5F0E6", "#2F5F8A", "#B9603A"], warmth=.85, color=.55, era=.55, tags=['mediterranean']),
  O("A mountain lodge with a fire", "Stone, timber and wool", ["#A79C8C", "#7A5236", "#6E7A4F"], rustic=.95, mood=.6, warmth=.75)], tags=['rustic', 'farmhouse']),
 dict(q="Which hotel would you book?", o=[
  O("A sleek design hotel", "Clean, gallery-like", ["#F4F3F0", "#5A5A58", "#232323"], era=0, mood=.5, rustic=.1, color=.2, tags=['contemporary', 'minimalist', 'modern-organic']),
  O("A converted warehouse loft", "Brick, steel, big windows", ["#9A4E35", "#B8B5AF", "#2B2B2B"], rustic=.85, mood=.75, tags=['industrial']),
  O("A 1920s grand hotel", "Velvet, marble, chandeliers", ["#12505A", "#B8934A", "#161616"], era=.9, mood=.85, color=.85, tags=['art-deco', 'transitional', 'eclectic-maximalist']),
  O("A jungle lodge or safari tent", "Canvas, rattan, greenery", ["#4C7A47", "#C9A46C", "#8A5A34"], green=1, rustic=.5, color=.7, warmth=.7)], tags=['tropical', 'bohemian']),
 dict(q="Choose the finishing touch.", o=[
  O("Brushed brass and a sculptural lamp", "Quiet luxury", ["#B08D57", "#F3EEE6", "#4A3B30"], era=.3, warmth=.65, rustic=.3, tags=['modern-organic', 'contemporary', 'mid-century-modern', 'transitional']),
  O("Black iron and an Edison bulb", "Strong lines, warm glow", ["#2B2A28", "#C8913F", "#5D6063"], rustic=.85, mood=.7, tags=['industrial', 'farmhouse', 'rustic']),
  O("Gold, mirrors and a chandelier", "Sparkle and drama", ["#B8934A", "#D9C39A", "#5C1F2B"], era=.9, mood=.75, tags=['art-deco', 'eclectic-maximalist']),
  O("Rattan, rope and woven lights", "Natural and handmade", ["#C9A46C", "#CDB28A", "#6E7445"], green=.8, rustic=.5, warmth=.7, color=.5)], tags=['bohemian', 'coastal', 'tropical', 'mediterranean']),
 dict(q="Which era feels like you?", o=[
  O("Brand new and current", "Latest, cleanest lines", ["#F4F3F0", "#CFC8BD", "#232323"], era=0, tags=['contemporary', 'minimalist']),
  O("Classic, but fresh", "Mouldings and modern art", ["#F5F1EA", "#C9C0B2", "#2F3E55"], era=.55, decor=.4, tags=['transitional', 'farmhouse']),
  O("Retro '50s and '60s", "Tapered legs, sunbursts", ["#D3A232", "#C4632D", "#2F6F73"], era=.75, color=.65, tags=['mid-century-modern']),
  O("Old and collected over time", "Vintage finds, family pieces", ["#5A3E2B", "#B5562F", "#CDB28A"], era=.65, decor=.8, rustic=.6)], tags=['eclectic-maximalist', 'bohemian', 'rustic']),
 dict(q="Which colours are you drawn to?", o=[
  O("Soft whites, greys and pale wood", "Light and airy", ["#F6F5F1", "#D6D8D6", "#D7C3A3"], color=.1, warmth=.35, mood=.05, tags=['scandinavian', 'minimalist', 'japandi']),
  O("Sand and sea blues", "Fresh and breezy", ["#DCCBAE", "#B9CCD6", "#23384F"], color=.4, warmth=.3, mood=0, tags=['coastal']),
  O("Rust, olive and terracotta", "Earthy and warm", ["#B5562F", "#6E7445", "#C0704B"], warmth=.85, color=.55, tags=['bohemian', 'mediterranean', 'mid-century-modern', 'farmhouse']),
  O("Emerald, sapphire and ruby", "Jewel tones", ["#1F6B4A", "#23407A", "#B0305A"], color=.9, mood=.8)], tags=['art-deco', 'eclectic-maximalist']),
 dict(q="Pick a word for your home.", o=[
  O("Calm", "A place to switch off", ["#F2EEE6", "#E4DCCF", "#A8A196"], color=.1, mood=.15, decor=.15, tags=['japandi', 'minimalist', 'modern-organic', 'scandinavian', 'coastal']),
  O("Cosy", "A place to curl up", ["#9A5B32", "#EFE8DA", "#6E7A4F"], warmth=.8, mood=.6, rustic=.7, tags=['rustic', 'farmhouse', 'scandinavian']),
  O("Lively", "A place full of life", ["#E07A5F", "#4C7A47", "#E3A23B"], color=.75, decor=.7, green=.7, tags=['bohemian', 'tropical', 'eclectic-maximalist', 'mid-century-modern']),
  O("Glamorous", "A place to impress", ["#161616", "#B8934A", "#1F4D43"], era=.85, mood=.85, color=.8, rustic=.05)], tags=['art-deco', 'contemporary', 'transitional']),
]
