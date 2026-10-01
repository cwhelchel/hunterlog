#
# Utility class to help out with Qt Color Values.
#
class QCOLOR:
    SPEC_RGB = 1
    SPEC_INVALID = 0

    def __init__(self, spec, alpha, red, green, blue):
        self.spec = spec
        self.red = red
        self.green = green
        self.blue = blue
        self.alpha = alpha

    @classmethod
    def Black(cls):
        return QCOLOR(QCOLOR.SPEC_RGB, 255, 0, 0, 0)

    @classmethod
    def Red(cls):
        return QCOLOR(QCOLOR.SPEC_RGB, 255, 255, 0, 0)

    @classmethod
    def RGBA(cls, alpha, red, green, blue):
        return QCOLOR(QCOLOR.SPEC_RGB, alpha, red, green, blue)

    @classmethod
    def White(cls):
        return QCOLOR(QCOLOR.SPEC_RGB, 255,255,255,255)

    @classmethod
    def Uncolor(cls):
        return QCOLOR(QCOLOR.SPEC_INVALID, 0,0,0,0)


