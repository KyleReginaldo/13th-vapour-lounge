import { Facebook } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted mt-20 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold gradient-text mb-4">
              <Image
                src="/logo.jpg"
                alt="13th Vapour Lounge Logo"
                width={64}
                height={64}
              />{" "}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Trece Martires premier vape shop offering premium e-liquids,
              devices, and accessories.
            </p>
            <div className="flex gap-3">
              <Link
                href="https://www.facebook.com/profile.php?id=61553552038082"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="p-2 bg-background rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Facebook className="h-4 w-4" />
                </div>
              </Link>
              {/* <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="p-2 bg-background rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Instagram className="h-4 w-4" />
                </div>
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="p-2 bg-background rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Twitter className="h-4 w-4" />
                </div>
              </Link> */}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/products"
                  className="hover:text-foreground transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=juice"
                  className="hover:text-foreground transition-colors"
                >
                  Vape Juice
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=devices"
                  className="hover:text-foreground transition-colors"
                >
                  Devices
                </Link>
              </li>
              <li>
                <Link
                  href="/products?tag=new"
                  className="hover:text-foreground transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/products?tag=sale"
                  className="hover:text-foreground transition-colors"
                >
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/profile"
                  className="hover:text-foreground transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="hover:text-foreground transition-colors"
                >
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link
                  href="/age-verification"
                  className="hover:text-foreground transition-colors"
                >
                  Age Verification
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-foreground transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} 13th Vapour Lounge. All rights reserved.</p>
          <p className="mt-2">
            This website contains products intended for adults 18 years or
            older.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
