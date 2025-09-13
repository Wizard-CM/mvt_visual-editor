import { IsUrl, IsNotEmpty } from 'class-validator';

export class LaunchRequestDto {
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
