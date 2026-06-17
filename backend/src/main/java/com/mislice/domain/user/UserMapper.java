package com.mislice.domain.user;

import com.mislice.domain.user.dto.AddressDto;
import com.mislice.domain.user.dto.UserDto;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserDto toDto(User user);

    AddressDto toDto(Address address);

    List<AddressDto> toAddressDtos(List<Address> addresses);
}
