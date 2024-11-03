import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FC } from "react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return (
    <div className="">
      <h1>All Events</h1>
      <div className="grid grid-cols-12">
        <Card className="col-span-4 p-2 h-56">
          <div className="flex items-center text-xs">
            <Image
              src={
                "https://probo.gumlet.io/image/upload/probo_product_images/Bar_Chart.png"
              }
              alt="adfa"
              height={20}
              width={20}
            />
            29880 traders
          </div>

          <div className="grid grid-cols-12">
            <Image
              src={
                "https://probo.gumlet.io/image/upload/probo_product_images/IMAGE_4a24f956-01f5-48e0-ae58-e807f4aef5a1.png"
              }
              alt="adfa"
              height={200}
              width={100}
              className="rounded-lg col-span-3"
            />
            <p className="col-span-9 font-medium text-lg">
              India to win the 3rd Test vs New Zealand?
            </p>
          </div>
          <p className="text-xs mt-2">IND trail by 149 runs</p>

          <div className="flex space-x-1 mt-3">
            <Link
              href={""}
              className={cn(
                buttonVariants({ variant: "yes" }),
                "w-full font-semibold"
              )}
            >
              Yes ₹0
            </Link>
            <Link
              href={""}
              className={cn(
                buttonVariants({ variant: "no" }),
                "w-full font-semibold"
              )}
            >
              No ₹0
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default page;
