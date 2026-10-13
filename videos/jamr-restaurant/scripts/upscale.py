import sys, cv2, numpy as np
model, src, dst = sys.argv[1], sys.argv[2], sys.argv[3]
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel(model); sr.setModel("edsr", 4)
img = cv2.imread(src, cv2.IMREAD_UNCHANGED)
bgr, a = img[:, :, :3], img[:, :, 3]
# premultiply-ish: fill transparent pixels with edge color to avoid dark halos
mask = (a > 0).astype(np.uint8)
bgr_filled = cv2.inpaint(bgr, (1 - mask) * 255, 3, cv2.INPAINT_TELEA) if mask.min() == 0 else bgr
up = sr.upsample(bgr_filled)
a_up = cv2.resize(a, (up.shape[1], up.shape[0]), interpolation=cv2.INTER_CUBIC)
a_up = cv2.GaussianBlur(a_up, (3, 3), 0)
out = np.dstack([up, a_up])
cv2.imwrite(dst, out)
print(dst, out.shape)
