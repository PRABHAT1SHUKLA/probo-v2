import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BriefcaseBusiness, ChevronDown, Home, WalletMinimal } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface NavbarProps {
  
}

const Navbar: FC<NavbarProps> = ({}) => {
  return (
    <nav className='fixed top-0 inset-x-0 h-fit bg-[#f5f5f5] border-b border-zinc-300 z-[10] py-2'>
      <div className='container max-w-[1400px] h-full mx-auto flex items-center justify-between gap-2'>
        <Link href={"/"}>
          <Image 
            src="https://probo.in/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.b8a0a3e7.webp&w=128&q=75"
            alt="Logo"
            height={200}
            width={200}
            className="h-12 w-28"
          />
        </Link>

        <div className='flex gap-10 items-center justify-center'>
          <div className='flex flex-col items-center'>
            <Home className='h-5 w-5' />
            <p className='text-sm font-light tracking-wide'>Home</p>
          </div>

          <div className='flex flex-col items-center'>
          <BriefcaseBusiness className='h-5 w-5'  />
            <p className='text-sm font-light tracking-wide'>Portfolio</p>
          </div>

          <div className='flex gap-4 py-2 px-3 border-[1px] rounded-md '>
            <WalletMinimal className='h-5 w-5' />
            <p className='font-semibold tracking-wide'>₹0</p>
          </div>

          <div className='flex justify-center items-center gap-1'>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <p>
              <ChevronDown className='h-5 w-5' />
            </p>
          </div>
          
        </div>
      </div>
    </nav>
  )
}

export default Navbar