from PIL import Image

def isolate_white(image_path, output_path):
    # Open the image
    image = Image.open(image_path).convert("RGBA")  # Open in RGBA to handle transparency if present
    pixels = image.load()

    # Define the white color threshold (pure white)
    white_threshold = (255, 255, 255, 255)  # RGBA value for pure white

    # Iterate over all pixels in the image
    for y in range(image.height):
        for x in range(image.width):
            if pixels[x, y][0] < 100 and pixels[x, y][1] <100 and pixels[x, y][2] < 100 and pixels[x, y][3] > 100:
                pixels[x, y]= (0, 0, 0, pixels[x, y][3])
            else:
                pixels[x, y] = (0, 0, 0, 0)  # Set non-white pixels to black

    # Save the modified image
    image.save(output_path)

# Usage example
isolate_white("black_logo__.png", "black_logo.png")
