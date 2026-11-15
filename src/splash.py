import tkinter as tk

from fs.glob import get_resource_path


def run_show_splash(queue):
    # Initialize splash screen window
    splash = tk.Tk()
    splash.overrideredirect(True)  # Remove title bar and borders

    # Center the splash screen on the display
    width, height = 800, 680
    screen_width = splash.winfo_screenwidth()
    screen_height = splash.winfo_screenheight()
    x = (screen_width // 2) - (width // 2)
    y = (screen_height // 2) - (height // 2)
    splash.geometry(f"{width}x{height}+{x}+{y}")

    img_path = get_resource_path("src/assets/logo.png")
    img = tk.PhotoImage(file=img_path)
    transparent_key = "#050505"

    # Windows-only: makes the specified color completely transparent
    splash.configure(bg=transparent_key)
    try:
        splash.wm_attributes("-transparentcolor", transparent_key)
    except tk.TclError:
        pass  # Fallback for Linux/macOS where -transparentcolor is unsupported

    tk.Label(
        splash,
        image=img,
        bg=transparent_key,
        bd=0,
        highlightthickness=0,
        compound="top",
        text="Starting Hunterlog...",
        font=("Arial", 16, "bold"),
        fg="white",
    ).pack()

    # Poll the multiprocessing queue to check if pywebview is ready
    def check_ready():
        if not queue.empty():
            # anything pushed to this queue will kill splash screen
            splash.destroy()
        else:
            splash.after(100, check_ready)

    splash.after(100, check_ready)
    splash.mainloop()
