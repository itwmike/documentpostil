using iTextSharp.text;
using iTextSharp.text.pdf;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DocumentConvert.Img2PDF
{
    class Program
    {
        static void Main(string[] args)
        {
            Rectangle rec = new Rectangle(PageSize.A4);//
            Document doc = new Document(rec);
            var fs = new System.IO.FileStream(AppDomain.CurrentDomain.BaseDirectory+ @"\123.pdf", System.IO.FileMode.OpenOrCreate);
            var write = PdfWriter.GetInstance(doc, fs);
            doc.Open();
            var imgDirectory = AppDomain.CurrentDomain.BaseDirectory+"\\img";
            foreach (var item in System.IO.Directory.GetFiles(imgDirectory))
            {
                Image img = iTextSharp.text.Image.GetInstance(item);
                if (img.Height > iTextSharp.text.PageSize.A4.Height)
                {
                    img.ScaleToFit(iTextSharp.text.PageSize.A4.Width, iTextSharp.text.PageSize.A4.Height);
                }
                else if (img.Width > iTextSharp.text.PageSize.A4.Width)
                {
                    img.ScaleToFit(iTextSharp.text.PageSize.A4.Width, iTextSharp.text.PageSize.A4.Height);
                }
                img.Alignment = iTextSharp.text.Image.ALIGN_MIDDLE;
                doc.Add(img);
            }
            doc.Close();
            doc.Dispose();
        }
    }
}
