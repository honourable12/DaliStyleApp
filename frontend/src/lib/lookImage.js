const W = 1080;
const H = 1350;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateLookImage(look, user) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#F9F9F9";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(0, 0, W, 180);

  // Draw the Stylora logo (inline SVG data URL - avoids CORS issues)
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="510 150 400 480" width="80" height="80">
    <g fill="#C5A059"><path d="M 639.00 190.00 C 634.71 183.84 640.51 170.70 646.75 164.75 C 653.00 158.80 665.77 154.55 675.22 156.78 C 684.67 159.01 691.55 164.08 696.92 173.08 C 702.29 182.08 695.56 196.36 696.00 204.00 C 704.75 191.59 701.66 175.43 692.75 164.25 C 683.84 153.07 663.80 153.64 653.23 158.23 C 642.66 162.82 630.50 181.99 639.00 190.00 Z"/></g>
    <g fill="#A79061"><path d="M 812.00 216.00 C 808.37 222.70 800.19 230.05 792.25 234.25 C 784.32 238.46 775.31 247.04 766.31 249.30 C 757.30 251.57 747.74 261.44 738.92 262.92 C 730.11 264.41 719.94 250.25 710.78 250.22 C 701.62 250.20 691.67 234.86 682.00 238.00 C 679.67 241.10 678.05 245.04 675.00 248.00 C 679.86 251.14 687.17 253.28 691.92 256.08 C 696.68 258.87 705.09 260.97 708.92 264.08 C 712.76 267.18 724.89 268.34 725.00 273.00 C 725.11 277.62 715.02 281.43 713.08 286.08 C 711.14 290.73 704.72 295.45 702.70 300.70 C 700.67 305.94 693.80 311.31 695.00 318.00 C 714.48 297.74 737.33 274.40 763.00 265.00 C 772.63 259.46 783.95 254.44 792.75 247.75 C 801.55 241.06 810.38 233.94 816.69 224.69 C 823.01 215.45 828.31 199.19 824.00 190.00 C 822.58 199.31 818.30 208.77 812.00 216.00 Z"/></g>
    <g fill="#31322C"><path d="M 675.00 322.00 C 673.36 316.57 677.82 311.03 680.00 306.00 C 669.50 309.46 652.78 308.76 642.98 305.02 C 633.17 301.29 622.26 298.42 616.70 289.30 C 611.14 280.19 601.51 276.35 603.00 265.00 C 592.17 270.90 577.86 274.36 567.31 280.31 C 556.75 286.25 546.07 292.91 539.25 303.25 C 532.42 313.59 522.26 323.05 522.00 335.00 C 517.97 329.77 517.66 341.28 513.00 342.00 C 515.06 344.47 518.66 350.36 520.00 345.00 C 522.22 346.88 521.12 348.46 521.00 351.00 C 528.46 353.84 532.56 362.82 539.30 366.70 C 546.03 370.59 550.73 378.61 557.25 382.75 C 563.77 386.89 568.91 369.34 575.00 368.00 C 580.09 375.83 583.71 383.30 586.07 392.93 C 588.44 402.55 593.46 409.83 593.02 420.98 C 592.59 432.12 601.43 436.19 611.98 438.02 C 622.53 439.86 631.09 443.03 642.00 443.00 C 652.91 442.97 665.78 443.14 675.93 440.93 C 686.07 438.71 693.31 435.82 703.00 433.00 C 699.01 404.05 705.69 375.56 717.00 350.00 C 716.86 379.75 733.55 408.38 757.25 426.75 C 780.95 445.12 803.94 456.60 829.30 471.70 C 854.67 486.80 877.93 508.16 878.00 540.00 C 878.07 571.84 851.34 594.61 822.00 601.00 C 818.38 602.87 809.80 606.83 802.00 606.00 C 794.20 605.17 785.30 604.97 777.93 603.07 C 770.55 601.17 764.99 596.76 757.00 597.00 C 755.57 593.84 749.08 588.40 742.75 592.75 C 736.43 597.11 739.97 601.72 746.00 605.00 C 779.40 627.27 824.66 623.16 858.30 603.30 C 891.94 583.45 904.46 538.04 886.31 504.70 C 868.15 471.35 837.53 458.41 807.08 439.92 C 776.63 421.43 745.68 405.31 735.78 367.22 C 725.88 329.13 762.31 299.08 794.31 285.31 C 826.30 271.53 851.47 239.69 859.00 207.00 C 867.89 222.29 865.33 243.04 862.78 259.78 C 860.23 276.52 871.83 288.35 881.00 301.00 C 869.95 306.23 868.54 317.57 872.00 328.00 C 869.32 327.47 868.66 331.48 866.00 331.00 C 873.28 338.00 864.91 341.20 865.00 349.00 C 865.09 356.80 866.16 368.71 856.00 367.00 C 845.85 365.28 840.78 364.74 832.00 364.00 C 823.22 363.26 816.36 365.08 810.08 369.08 C 803.80 373.09 800.68 377.30 797.31 383.31 C 793.93 389.31 791.73 397.20 791.00 404.00 C 790.84 405.45 789.97 409.31 790.00 410.00 C 790.07 410.30 790.84 411.82 791.00 412.00 C 795.94 415.07 800.60 419.02 806.00 421.00 C 805.67 412.81 807.74 403.33 810.02 396.02 C 812.31 388.72 815.41 383.62 822.98 380.98 C 830.54 378.33 839.84 381.56 847.33 382.67 C 854.82 383.78 865.67 383.58 871.92 379.92 C 878.17 376.27 883.67 370.12 881.99 362.01 C 880.31 353.89 884.05 347.42 887.00 340.00 C 889.95 332.58 888.26 324.59 887.03 318.03 C 885.79 311.47 901.24 310.31 898.99 302.01 C 896.74 293.71 894.21 290.32 888.75 284.25 C 883.30 278.18 880.18 274.15 879.00 266.00 C 877.82 257.85 880.68 247.84 882.00 240.00 C 883.32 232.16 881.29 221.67 879.32 214.68 C 877.36 207.68 874.53 201.06 870.92 195.08 C 867.31 189.11 864.17 183.79 858.75 179.25 C 853.33 174.71 848.24 169.38 841.00 169.00 C 850.92 206.36 830.07 244.06 799.75 262.75 C 769.43 281.44 743.65 291.45 719.75 318.75 C 695.85 346.06 684.52 384.16 686.00 421.00 C 661.59 429.90 633.23 428.14 609.00 420.00 C 606.08 391.18 593.37 365.28 580.00 340.00 C 572.77 346.72 569.75 351.00 562.92 358.92 C 556.09 366.84 551.35 355.19 543.75 350.25 C 536.16 345.31 531.09 338.45 538.08 331.08 C 545.07 323.71 546.33 316.68 552.75 309.75 C 559.18 302.82 563.82 297.00 572.31 293.31 C 580.79 289.61 588.05 284.92 597.00 283.00 C 599.71 289.59 603.98 295.55 609.25 300.75 C 614.51 305.95 619.73 310.67 626.31 313.69 C 632.88 316.72 641.69 320.90 648.93 321.07 C 656.17 321.25 668.38 326.63 675.00 322.00 Z"/></g>
    <g fill="#2C2C27"><path d="M 742.00 571.00 C 745.92 567.08 750.13 562.87 754.00 559.00 C 775.31 534.07 787.51 507.59 797.00 477.00 C 797.31 475.99 797.33 474.94 798.00 474.00 C 798.14 473.80 799.90 472.02 800.00 472.00 C 794.32 469.04 788.94 465.18 783.00 463.00 C 768.75 556.21 663.33 632.21 571.00 596.00 C 580.34 553.01 594.99 511.51 606.00 469.00 C 616.88 471.19 627.87 473.96 639.00 475.00 C 639.30 474.94 640.89 473.54 641.00 473.00 C 636.05 473.75 631.88 471.61 627.00 472.00 C 631.12 469.22 635.82 471.90 640.00 471.00 C 636.00 469.08 636.97 466.04 634.00 463.00 C 636.28 462.94 641.86 463.64 638.00 461.00 C 643.51 460.67 653.82 462.13 656.00 459.00 C 651.56 459.40 646.66 458.35 643.00 458.00 C 629.22 456.66 616.79 456.71 604.02 450.98 C 591.26 445.24 587.30 461.05 580.92 469.92 C 574.54 478.79 569.88 488.62 563.75 497.75 C 557.63 506.88 551.36 516.29 545.77 525.77 C 540.18 535.25 533.35 544.32 527.77 553.77 C 522.19 563.23 515.79 572.27 511.00 582.00 C 544.71 608.16 588.53 623.30 632.00 621.00 C 675.47 618.70 709.66 598.64 742.00 571.00 M 580.00 502.00 C 570.97 531.12 563.26 560.62 555.00 590.00 C 547.42 586.42 540.39 581.60 533.00 578.00 C 547.17 552.06 564.19 526.84 580.00 502.00 Z"/></g>
  </svg>`;
  const logoImg = await loadImage("data:image/svg+xml;base64," + btoa(logoSvg));
  if (logoImg) {
    ctx.drawImage(logoImg, 50, 40, 100, 100);
  }

  // Brand name next to logo
  ctx.fillStyle = "#C5A059";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("STYLORA", 170, 90);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "18px sans-serif";
  ctx.fillText("AI-curated outfit · " + (look.occasion || "Casual"), 170, 120);

  const skinHex = user?.metadata_skin?.hex || "#d7bd96";
  const skinName = user?.skin_type || "Medium";
  ctx.fillStyle = skinHex;
  roundRect(ctx, W - 280, 50, 60, 60, 30);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(skinName, W - 200, 80);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "14px sans-serif";
  ctx.fillText("Your skin tone", W - 200, 105);

  let y = 240;
  ctx.fillStyle = "#1A1A1A";
  ctx.font = "italic 36px Georgia, serif";
  ctx.fillText("Today's look", 60, y);
  y += 50;

  for (const item of look.items.slice(0, 4)) {
    ctx.fillStyle = "white";
    roundRect(ctx, 60, y, W - 120, 160, 24);
    ctx.fill();

    const img = await loadImage(item.image_url);
    if (img) {
      ctx.save();
      roundRect(ctx, 80, y + 20, 120, 120, 16);
      ctx.clip();
      ctx.drawImage(img, 80, y + 20, 120, 120);
      ctx.restore();
    } else {
      ctx.fillStyle = item.color_primary || "#d7bd96";
      roundRect(ctx, 80, y + 20, 120, 120, 16);
      ctx.fill();
    }

    ctx.fillStyle = "#1A1A1A";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(item.name || "Item", 230, y + 60);

    ctx.fillStyle = "#666666";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText((item.category || "").toUpperCase(), 230, y + 90);

    ctx.fillStyle = item.color_primary || "#d7bd96";
    ctx.beginPath();
    ctx.arc(240, y + 125, 12, 0, Math.PI * 2);
    ctx.fill();

    if (item.brand) {
      ctx.fillStyle = "#C5A059";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(item.brand, 270, y + 130);
    }
    y += 180;
  }

  const noteY = Math.max(y + 20, H - 380);
  ctx.fillStyle = "#1A1A1A";
  roundRect(ctx, 60, noteY, W - 120, 280, 32);
  ctx.fill();

  ctx.fillStyle = "#C5A059";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("✨ DIGITAL STYLIST", 100, noteY + 50);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "italic 28px Georgia, serif";
  const note = '"' + (look.stylist_note || "This combination creates a balanced and stylish look.") + '"';
  const words = note.split(" ");
  let line = "";
  let noteYCursor = noteY + 100;
  const maxWidth = W - 200;
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, 100, noteYCursor);
      line = word + " ";
      noteYCursor += 38;
    } else { line = testLine; }
  }
  ctx.fillText(line, 100, noteYCursor);

  const harmony = Math.round((look.harmony_score || 0) * 100);
  ctx.fillStyle = "rgba(197,160,89,0.2)";
  roundRect(ctx, 100, noteY + 210, 200, 40, 20);
  ctx.fill();
  ctx.fillStyle = "#C5A059";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("Harmony: " + harmony + "%", 120, noteY + 236);

  return canvas.toDataURL("image/png");
}

export function downloadImage(dataUrl, filename = "stylora-look.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
