import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const roles = [
    {
      name: 'User',
      description: 'Book meetings and manage your schedule with experts.',
      loginPath: '/login/user',
      signupPath: '/signup/user',
      color: '#FC6C26',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      name: 'Host',
      description: 'Share your availability and host professional meetings.',
      loginPath: '/login/host',
      signupPath: '/signup/host',
      color: '#FC6C26',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Admin',
      description: 'Manage users, view statistics and control the platform.',
      loginPath: '/login/admin',
      signupPath: '/signup/admin',
      color: '#1A1A1A',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF4D6] py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-[900px] mx-auto text-center">
        <h1 className="text-[32px] md:text-[48px] font-bold text-[#1A1A1A] leading-tight mb-4">
          NexGen Schedule
        </h1>
        <p className="text-[16px] md:text-[18px] text-[#4A4A4A] mb-12 md:mb-16">
          Premium scheduling for modern professionals. Simple, fast, and beautiful.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div 
              key={role.name}
              className="bg-[#FFF4D6] border border-[#E8DCC0] rounded-[16px] p-8 transition-all duration-200 hover:translate-y-[-4px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)] group text-left"
            >
              <div 
                className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-6"
                style={{ backgroundColor: role.color }}
              >
                {role.icon}
              </div>
              
              <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-2">
                {role.name}
              </h3>
              <p className="text-[13px] text-[#8A8A8A] mb-8 leading-relaxed">
                {role.description}
              </p>

              <div className="flex flex-col gap-3">
                <Link 
                  to={role.signupPath}
                  className="w-full py-2.5 bg-[#FC6C26] text-white text-[14px] font-medium rounded-[10px] text-center transition-colors hover:bg-[#E05A1A]"
                >
                  Sign Up
                </Link>
                <Link 
                  to={role.loginPath}
                  className="w-full py-2.5 border-[1.5px] border-[#FC6C26] text-[#FC6C26] text-[14px] font-medium rounded-[10px] text-center transition-colors hover:bg-[#FFF4D6]"
                >
                  Login
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
